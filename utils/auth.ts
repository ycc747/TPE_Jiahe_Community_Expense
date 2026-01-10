import { User, UserRole, AddressRegistration, ApprovalStatus } from '../types';

// Simple hash function (for demo - in production use bcrypt or similar)
export const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
};

// Get current logged-in user
export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem('jiahe_current_user');
    if (!userJson) return null;
    try {
        return JSON.parse(userJson);
    } catch {
        return null;
    }
};

// Set current user
export const setCurrentUser = (user: User | null): void => {
    if (user) {
        localStorage.setItem('jiahe_current_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('jiahe_current_user');
    }
};

// Logout
export const logout = (): void => {
    localStorage.removeItem('jiahe_current_user');
};

// Check if user has permission for a specific action
export const hasPermission = (user: User | null, requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
};

// Check if user can access a specific resident's data
export const canAccessResident = (user: User | null, residentId: string): boolean => {
    if (!user) return false;

    // ADMIN, MGR, KEEP can access all residents
    if (['ADMIN', 'MGR', 'KEEP'].includes(user.role)) {
        return true;
    }

    // EXT can only access their registered addresses
    if (user.role === 'EXT') {
        return user.registeredAddresses.includes(residentId);
    }

    return false;
};

// Get all users
export const getAllUsers = (): User[] => {
    const usersJson = localStorage.getItem('jiahe_users');
    if (!usersJson) return [];
    try {
        return JSON.parse(usersJson);
    } catch {
        return [];
    }
};

// Save user
export const saveUser = (user: User): void => {
    const users = getAllUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);

    if (existingIndex >= 0) {
        users[existingIndex] = user;
    } else {
        users.push(user);
    }

    localStorage.setItem('jiahe_users', JSON.stringify(users));
};

// Get user by username
export const getUserByUsername = (username: string): User | null => {
    const users = getAllUsers();
    return users.find(u => u.username === username) || null;
};

// Address registration functions
export const getAllRegistrations = (): AddressRegistration[] => {
    const regsJson = localStorage.getItem('jiahe_registrations');
    if (!regsJson) return [];
    try {
        return JSON.parse(regsJson);
    } catch {
        return [];
    }
};

export const saveRegistration = (registration: AddressRegistration): void => {
    const registrations = getAllRegistrations();
    const existingIndex = registrations.findIndex(r => r.id === registration.id);

    if (existingIndex >= 0) {
        registrations[existingIndex] = registration;
    } else {
        registrations.push(registration);
    }

    localStorage.setItem('jiahe_registrations', JSON.stringify(registrations));
};

export const getPendingRegistrations = (): AddressRegistration[] => {
    return getAllRegistrations().filter(r => r.status === 'pending');
};

export const getUserRegistrations = (userId: string): AddressRegistration[] => {
    return getAllRegistrations().filter(r => r.userId === userId);
};

// Initialize admin user if not exists
export const initializeAdminUser = async (): Promise<void> => {
    const users = getAllUsers();
    const adminExists = users.some(u => u.role === 'ADMIN');

    if (!adminExists) {
        const adminPassword = 'admin123'; // Default password - should be changed
        const adminUser: User = {
            id: 'admin-001',
            username: 'admin',
            passwordHash: await hashPassword(adminPassword),
            role: 'ADMIN',
            registeredAddresses: [],
            createdAt: new Date().toISOString()
        };
        saveUser(adminUser);
    }
};
