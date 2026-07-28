/**
 * Command Queue Utilities for NB-IoT Meter Control
 * Handles serial execution of commands and persistence
 */

export type CommandType = 'SWITCH_ON' | 'SWITCH_OFF';
export interface MeterCommand {
  id: string;
  meterAccountNo: string;
  type: CommandType;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  createdAt: string;
  executedAt?: string;
  createdBy: string; // User email
}
const COMMAND_QUEUE_KEY = 'motech_meter_commands';

// Get all commands
export function getAllCommands(): MeterCommand[] {
  try {
    const data = localStorage.getItem(COMMAND_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load commands:', error);
    return [];
  }
}

// Save commands
function saveCommands(commands: MeterCommand[]): void {
  try {
    localStorage.setItem(COMMAND_QUEUE_KEY, JSON.stringify(commands));
  } catch (error) {
    console.error('Failed to save commands:', error);
  }
}

// Add a command to the queue
export function queueCommand(meterAccountNo: string, type: CommandType, userEmail: string): MeterCommand {
  const commands = getAllCommands();
  const newCommand: MeterCommand = {
    id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    meterAccountNo,
    type,
    status: 'queued',
    createdAt: new Date().toISOString(),
    createdBy: userEmail
  };
  commands.push(newCommand);
  saveCommands(commands);

  // Trigger processing check
  processQueue(meterAccountNo);
  return newCommand;
}

// Get commands for a specific meter
export function getMeterCommands(meterAccountNo: string): MeterCommand[] {
  const commands = getAllCommands();
  return commands.filter((c) => c.meterAccountNo === meterAccountNo).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
}

// Process the queue for a specific meter
// Ensures serial execution: Only one 'processing' command at a time
export function processQueue(meterAccountNo: string): void {
  const commands = getAllCommands();
  const meterCommands = commands.filter((c) => c.meterAccountNo === meterAccountNo && (c.status === 'queued' || c.status === 'processing')).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Oldest first

  if (meterCommands.length === 0) return;

  // Check if any command is currently processing
  const processingCmd = meterCommands.find((c) => c.status === 'processing');
  if (processingCmd) {
    // If a command is processing, we wait.
    // In a real app, we'd check for timeout here.
    // For simulation, we'll simulate execution completion if enough time passed
    const processingTime = new Date().getTime() - new Date(processingCmd.createdAt).getTime();
    if (processingTime > 5000) {
      // Simulate 5s execution time
      completeCommand(processingCmd.id, 'completed');
    }
    return;
  }

  // If no command is processing, pick the next queued one
  const nextCmd = meterCommands.find((c) => c.status === 'queued');
  if (nextCmd) {
    updateCommandStatus(nextCmd.id, 'processing');

    // Simulate NB-IoT latency
    setTimeout(() => {
      // Re-trigger process to complete it
      processQueue(meterAccountNo);
    }, 5000);
  }
}

// Update command status
export function updateCommandStatus(commandId: string, status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired'): void {
  const commands = getAllCommands();
  const cmdIndex = commands.findIndex((c) => c.id === commandId);
  if (cmdIndex !== -1) {
    commands[cmdIndex].status = status;
    if (status === 'completed' || status === 'failed' || status === 'expired') {
      commands[cmdIndex].executedAt = new Date().toISOString();
    }
    saveCommands(commands);

    // If completed, check if we need to expire subsequent conflicting commands?
    // The requirement: "if executed successfully, the second command in line automatically expires"
    // We will implement this logic here.
    if (status === 'completed') {
      const completedCmd = commands[cmdIndex];
      // Find next queued command for this meter
      const nextCmds = commands.filter((c) => c.meterAccountNo === completedCmd.meterAccountNo && c.status === 'queued' && new Date(c.createdAt).getTime() > new Date(completedCmd.createdAt).getTime());

      // If there is a next command, and we want to expire it based on the rule:
      // "if executed successfully, the second command in line automatically expires"
      // This is a bit ambiguous. Does it mean ALL subsequent commands? Or just the immediate next one?
      // I'll assume it means if we have a queue like [ON, OFF, ON], and the first ON finishes,
      // maybe the OFF expires? That seems destructive.
      // Let's interpret "second command in line" strictly.
      if (nextCmds.length > 0) {
        // Sort by time
        nextCmds.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const nextCmd = nextCmds[0];

        // Expire the next command
        // updateCommandStatus(nextCmd.id, 'expired') // Recursive call, be careful
        // Let's just update it in memory and save
        const nextCmdIndex = commands.findIndex((c) => c.id === nextCmd.id);
        if (nextCmdIndex !== -1) {
          commands[nextCmdIndex].status = 'expired';
          commands[nextCmdIndex].executedAt = new Date().toISOString();
          saveCommands(commands);
        }
      }
    }

    // Trigger next item in queue
    if (status === 'completed' || status === 'failed' || status === 'expired') {
      // We need to process the queue again to pick up the next item (if any wasn't expired)
      // Use setTimeout to break call stack
      setTimeout(() => {
        const currentCmd = commands[cmdIndex];
        processQueue(currentCmd.meterAccountNo);
      }, 100);
    }
  }
}

// Helper to complete a command (used in simulation)
function completeCommand(commandId: string, status: 'completed' | 'failed') {
  updateCommandStatus(commandId, status);
}