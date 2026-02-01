/**
 * Command Queue Management
 * Handles remote meter control commands with queue system
 */

import { logSecurityEvent } from './security';

export interface MeterCommand {
  id: string;
  meterId: string;
  meterNumber: string;
  command: 'connect' | 'disconnect';
  status: 'queued' | 'executing' | 'executed' | 'failed' | 'expired';
  createdBy: string;
  createdAt: string;
  scheduledFor?: string;
  executedAt?: string;
  expiresAt?: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
  metadata?: {
    reason?: string;
    notes?: string;
  };
}

const COMMANDS_STORAGE_KEY = 'hydrobox_meter_commands';
const MAX_COMMAND_ATTEMPTS = 3;
const COMMAND_EXPIRY_HOURS = 24;

/**
 * Get all commands
 */
export function getAllCommands(): MeterCommand[] {
  try {
    const stored = localStorage.getItem(COMMANDS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading commands:', error);
    return [];
  }
}

/**
 * Save commands to storage
 */
function saveCommands(commands: MeterCommand[]): void {
  localStorage.setItem(COMMANDS_STORAGE_KEY, JSON.stringify(commands));
}

/**
 * Get commands for a specific meter
 */
export function getMeterCommands(meterId: string): MeterCommand[] {
  const allCommands = getAllCommands();
  return allCommands.
  filter((cmd) => cmd.meterId === meterId).
  sort(
    (a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Get active command for a meter (queued or executing)
 */
export function getActiveMeterCommand(meterId: string): MeterCommand | null {
  const commands = getMeterCommands(meterId);
  return (
    commands.find(
      (cmd) => cmd.status === 'queued' || cmd.status === 'executing'
    ) || null);

}

/**
 * Get next queued command for a meter
 */
export function getNextQueuedCommand(meterId: string): MeterCommand | null {
  const commands = getMeterCommands(meterId);
  return commands.find((cmd) => cmd.status === 'queued') || null;
}

/**
 * Create a new command
 */
export function createCommand(
meterId: string,
meterNumber: string,
command: 'connect' | 'disconnect',
createdBy: string,
metadata?: {reason?: string;notes?: string;},
scheduledFor?: string)
: MeterCommand | {error: string;} {
  // Check if there's already an active command
  const activeCommand = getActiveMeterCommand(meterId);

  if (activeCommand) {
    return {
      error: `Cannot create command. Another command is ${activeCommand.status}. Please wait for it to complete.`
    };
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + COMMAND_EXPIRY_HOURS * 60 * 60 * 1000
  );

  const newCommand: MeterCommand = {
    id: crypto.randomUUID(),
    meterId,
    meterNumber,
    command,
    status: 'queued',
    createdBy,
    createdAt: now.toISOString(),
    scheduledFor: scheduledFor || now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    attempts: 0,
    maxAttempts: MAX_COMMAND_ATTEMPTS,
    metadata
  };

  const allCommands = getAllCommands();
  allCommands.push(newCommand);
  saveCommands(allCommands);

  logSecurityEvent('METER_COMMAND_CREATED', {
    commandId: newCommand.id,
    meterId,
    command,
    createdBy
  });

  return newCommand;
}

/**
 * Update command status
 */
export function updateCommandStatus(
commandId: string,
status: MeterCommand['status'],
error?: string)
: boolean {
  const allCommands = getAllCommands();
  const commandIndex = allCommands.findIndex((cmd) => cmd.id === commandId);

  if (commandIndex === -1) return false;

  const command = allCommands[commandIndex];
  command.status = status;

  if (status === 'executing') {
    command.attempts += 1;
  }

  if (status === 'executed') {
    command.executedAt = new Date().toISOString();

    // Expire all other queued commands for this meter
    allCommands.forEach((cmd) => {
      if (
      cmd.meterId === command.meterId &&
      cmd.id !== commandId &&
      cmd.status === 'queued')
      {
        cmd.status = 'expired';
        logSecurityEvent('METER_COMMAND_EXPIRED', {
          commandId: cmd.id,
          meterId: cmd.meterId,
          reason: 'previous_command_executed'
        });
      }
    });
  }

  if (status === 'failed') {
    command.error = error;

    // If max attempts reached, mark as failed permanently
    if (command.attempts >= command.maxAttempts) {
      logSecurityEvent('METER_COMMAND_MAX_ATTEMPTS', {
        commandId,
        meterId: command.meterId,
        attempts: command.attempts
      });
    } else {
      // Reset to queued for retry
      command.status = 'queued';
    }
  }

  saveCommands(allCommands);

  logSecurityEvent('METER_COMMAND_STATUS_UPDATED', {
    commandId,
    meterId: command.meterId,
    status,
    attempts: command.attempts
  });

  return true;
}

/**
 * Process expired commands
 */
export function processExpiredCommands(): number {
  const allCommands = getAllCommands();
  const now = new Date();
  let expiredCount = 0;

  allCommands.forEach((cmd) => {
    if (
    (cmd.status === 'queued' || cmd.status === 'executing') &&
    cmd.expiresAt &&
    new Date(cmd.expiresAt) < now)
    {
      cmd.status = 'expired';
      expiredCount++;

      logSecurityEvent('METER_COMMAND_EXPIRED', {
        commandId: cmd.id,
        meterId: cmd.meterId,
        reason: 'timeout'
      });
    }
  });

  if (expiredCount > 0) {
    saveCommands(allCommands);
  }

  return expiredCount;
}

/**
 * Cancel a queued command
 */
export function cancelCommand(commandId: string): boolean {
  const allCommands = getAllCommands();
  const commandIndex = allCommands.findIndex((cmd) => cmd.id === commandId);

  if (commandIndex === -1) return false;

  const command = allCommands[commandIndex];

  if (command.status !== 'queued') {
    return false; // Can only cancel queued commands
  }

  command.status = 'expired';
  saveCommands(allCommands);

  logSecurityEvent('METER_COMMAND_CANCELLED', {
    commandId,
    meterId: command.meterId
  });

  return true;
}

/**
 * Get command statistics for a meter
 */
export function getMeterCommandStats(meterId: string): {
  total: number;
  queued: number;
  executing: number;
  executed: number;
  failed: number;
  expired: number;
} {
  const commands = getMeterCommands(meterId);

  return {
    total: commands.length,
    queued: commands.filter((cmd) => cmd.status === 'queued').length,
    executing: commands.filter((cmd) => cmd.status === 'executing').length,
    executed: commands.filter((cmd) => cmd.status === 'executed').length,
    failed: commands.filter((cmd) => cmd.status === 'failed').length,
    expired: commands.filter((cmd) => cmd.status === 'expired').length
  };
}

/**
 * Simulate command execution (for demo purposes)
 * In production, this would communicate with the actual NBIoT/LoRa system
 */
export function simulateCommandExecution(commandId: string): void {
  setTimeout(() => {
    updateCommandStatus(commandId, 'executing');

    // Simulate network delay
    setTimeout(() => {
      // 90% success rate for simulation
      const success = Math.random() > 0.1;

      if (success) {
        updateCommandStatus(commandId, 'executed');
      } else {
        updateCommandStatus(commandId, 'failed', 'Communication timeout');
      }
    }, 3000);
  }, 1000);
}

/**
 * Clean up old commands (older than 30 days)
 */
export function cleanupOldCommands(): number {
  const allCommands = getAllCommands();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filteredCommands = allCommands.filter((cmd) => {
    return new Date(cmd.createdAt) > thirtyDaysAgo;
  });

  const removedCount = allCommands.length - filteredCommands.length;

  if (removedCount > 0) {
    saveCommands(filteredCommands);
    logSecurityEvent('COMMANDS_CLEANUP', { removedCount });
  }

  return removedCount;
}

// Auto-process expired commands on load
processExpiredCommands();