// src/utils/collaborationManager.ts
import { DiagramState, TableNode, RelationshipEdge, User } from "@/types";

// In a real app, you'd use a service like Firebase, Socket.io, or a custom WebSocket server
// This is a simplified mock implementation

export interface CollaborationSession {
  id: string;
  name: string;
  owner: User;
  participants: User[];
  diagram: DiagramState;
  lastModified: Date;
}

export interface UserAction {
  id: string;
  user: User;
  timestamp: Date;
  action: 'add_table' | 'remove_table' | 'update_table' | 'add_relationship' | 'remove_relationship';
  payload: any;
}

// Mocked session storage
let activeSessions: CollaborationSession[] = [];
let userActions: Record<string, UserAction[]> = {};

// Create a new collaborative session
export function createSession(name: string, owner: User, diagram: DiagramState): CollaborationSession {
  const sessionId = `session-${Date.now()}`;
  
  const session: CollaborationSession = {
    id: sessionId,
    name,
    owner,
    participants: [owner],
    diagram,
    lastModified: new Date()
  };
  
  activeSessions.push(session);
  userActions[sessionId] = [];
  
  return session;
}

// Join an existing session
export function joinSession(sessionId: string, user: User): CollaborationSession | null {
  const session = getSession(sessionId);
  
  if (!session) return null;
  
  // Check if user is already in the session
  if (!session.participants.some(p => p.id === user.id)) {
    session.participants.push(user);
  }
  
  return session;
}

// Leave a session
export function leaveSession(sessionId: string, userId: string): boolean {
  const session = getSession(sessionId);
  
  if (!session) return false;
  
  // Remove user from participants
  session.participants = session.participants.filter(p => p.id !== userId);
  
  // If owner leaves, assign ownership to another participant or close the session
  if (session.owner.id === userId) {
    if (session.participants.length > 0) {
      session.owner = session.participants[0];
    } else {
      // Close the session if no participants remain
      activeSessions = activeSessions.filter(s => s.id !== sessionId);
      delete userActions[sessionId];
    }
  }
  
  return true;
}

// Get a session by ID
export function getSession(sessionId: string): CollaborationSession | null {
  return activeSessions.find(s => s.id === sessionId) || null;
}

// Get all active sessions
export function getActiveSessions(): CollaborationSession[] {
  return [...activeSessions];
}

// Update the diagram in a session
export function updateSessionDiagram(sessionId: string, diagram: DiagramState, userId: string): boolean {
  const session = getSession(sessionId);
  
  if (!session) return false;
  
  // Check if user is a participant
  if (!session.participants.some(p => p.id === userId)) {
    return false;
  }
  
  session.diagram = diagram;
  session.lastModified = new Date();
  
  return true;
}

// Record a user action in the session
export function recordUserAction(
  sessionId: string, 
  user: User, 
  action: UserAction['action'], 
  payload: any
): UserAction | null {
  const session = getSession(sessionId);
  
  if (!session) return null;
  
  // Check if user is a participant
  if (!session.participants.some(p => p.id === user.id)) {
    return null;
  }
  
  const userAction: UserAction = {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user,
    timestamp: new Date(),
    action,
    payload
  };
  
  userActions[sessionId].push(userAction);
  
  // Limit history to last 100 actions
  if (userActions[sessionId].length > 100) {
    userActions[sessionId] = userActions[sessionId].slice(-100);
  }
  
  return userAction;
}

// Get action history for a session
export function getSessionHistory(sessionId: string): UserAction[] {
  return userActions[sessionId] || [];
}

// Get a shareable invite link for a session
export function getSessionInviteLink(sessionId: string): string {
  const session = getSession(sessionId);
  
  if (!session) throw new Error("Session not found");
  
  // In a real app, you might want to encrypt or shorten the URL
  return `${window.location.origin}/join-session/${sessionId}`;
}

// Implement real-time synchronization
// In a real app, you'd use WebSockets or a service like Firebase Realtime Database
export interface RealtimeSyncOptions {
  onDiagramUpdate?: (diagram: DiagramState) => void;
  onUserJoined?: (user: User) => void;
  onUserLeft?: (user: User) => void;
  onUserAction?: (action: UserAction) => void;
}

// Mock implementation of real-time sync
let syncCallbacks: Record<string, RealtimeSyncOptions> = {};

export function startRealtimeSync(sessionId: string, userId: string, options: RealtimeSyncOptions): () => void {
  const key = `${sessionId}:${userId}`;
  syncCallbacks[key] = options;
  
  // In a real app, you'd set up WebSocket listeners here
  
  // Return a cleanup function
  return () => {
    delete syncCallbacks[key];
  };
}

// Simulate receiving updates from other users
// In a real app, this would be triggered by WebSocket messages
export function simulateExternalUpdate(sessionId: string, diagram: DiagramState, actionUser: User): void {
  Object.entries(syncCallbacks).forEach(([key, callbacks]) => {
    if (key.startsWith(`${sessionId}:`)) {
      const userId = key.split(':')[1];
      
      // Don't notify the user who made the change
      if (userId !== actionUser.id) {
        callbacks.onDiagramUpdate?.(diagram);
      }
    }
  });
}

// Simulate user joined notification
export function simulateUserJoined(sessionId: string, user: User): void {
  Object.entries(syncCallbacks).forEach(([key, callbacks]) => {
    if (key.startsWith(`${sessionId}:`)) {
      const userId = key.split(':')[1];
      
      // Don't notify the user who joined
      if (userId !== user.id) {
        callbacks.onUserJoined?.(user);
      }
    }
  });
}

// Simulate user left notification
export function simulateUserLeft(sessionId: string, user: User): void {
  Object.entries(syncCallbacks).forEach(([key, callbacks]) => {
    if (key.startsWith(`${sessionId}:`)) {
      const userId = key.split(':')[1];
      
      // Don't notify the user who left
      if (userId !== user.id) {
        callbacks.onUserLeft?.(user);
      }
    }
  });
}

// Simulate user action notification
export function simulateUserAction(sessionId: string, action: UserAction): void {
  Object.entries(syncCallbacks).forEach(([key, callbacks]) => {
    if (key.startsWith(`${sessionId}:`)) {
      const userId = key.split(':')[1];
      
      // Don't notify the user who performed the action
      if (userId !== action.user.id) {
        callbacks.onUserAction?.(action);
      }
    }
  });
}

// Helper for cursor positions (for showing where other users are working)
export interface UserCursor {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
  lastUpdated: Date;
}

// Track cursor positions for each session
const sessionCursors: Record<string, UserCursor[]> = {};

export function updateUserCursor(sessionId: string, cursor: UserCursor): void {
  if (!sessionCursors[sessionId]) {
    sessionCursors[sessionId] = [];
  }
  
  const existingIndex = sessionCursors[sessionId].findIndex(c => c.userId === cursor.userId);
  
  if (existingIndex >= 0) {
    sessionCursors[sessionId][existingIndex] = cursor;
  } else {
    sessionCursors[sessionId].push(cursor);
  }
  
  // Notify other users of cursor update
  Object.entries(syncCallbacks).forEach(([key, callbacks]) => {
    if (key.startsWith(`${sessionId}:`)) {
      const userId = key.split(':')[1];
      
      // Don't notify the user who moved their cursor
      if (userId !== cursor.userId) {
        callbacks.onUserAction?.({
          id: `cursor-${Date.now()}`,
          user: { id: cursor.userId, name: cursor.username },
          timestamp: new Date(),
          action: 'update_table', // Reuse existing action type
          payload: { cursor }
        });
      }
    }
  });
}

export function getSessionCursors(sessionId: string): UserCursor[] {
  return sessionCursors[sessionId] || [];
}

// Clean up inactive cursors
setInterval(() => {
  const now = new Date();
  
  Object.keys(sessionCursors).forEach(sessionId => {
    sessionCursors[sessionId] = sessionCursors[sessionId].filter(cursor => {
      const age = now.getTime() - cursor.lastUpdated.getTime();
      return age < 30000; // Remove cursors inactive for more than 30 seconds
    });
  });
}, 10000);