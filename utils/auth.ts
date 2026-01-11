import { User, UserRole, AddressRegistration, ApprovalStatus, FeeConfig, DEFAULT_FEE_CONFIG } from '../types';

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

// Delete user
export const deleteUser = (userId: string): void => {
    const users = getAllUsers();
    const newUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('jiahe_users', JSON.stringify(newUsers));
};

// Update user role
export const updateUserRole = (userId: string, newRole: UserRole): void => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
        users[userIndex].role = newRole;
        localStorage.setItem('jiahe_users', JSON.stringify(users));
    }
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

// Register new user (EXT role by default)
export const registerUser = async (username: string, password: string): Promise<User> => {
    const users = getAllUsers();
    if (users.some(u => u.username === username)) {
        throw new Error('帳號已被使用');
    }

    const newUser: User = {
        id: `user-${username}-${Date.now()}`,
        username,
        passwordHash: await hashPassword(password),
        role: 'EXT',
        registeredAddresses: [],
        createdAt: new Date().toISOString()
    };

    saveUser(newUser);
    return newUser;
};

// Reset system data (Clear all except admin)
export const resetSystemData = (): void => {
    const users = getAllUsers();
    const admin = users.find(u => u.username === 'admin');

    if (admin) {
        localStorage.setItem('jiahe_users', JSON.stringify([admin]));
    } else {
        localStorage.removeItem('jiahe_users');
    }

    localStorage.removeItem('jiahe_registrations');
    localStorage.removeItem('jiahe_payments');
    window.location.reload();
};

// Initialize default users if they don't exist
export const initializeDefaultUsers = async (): Promise<void> => {
    const users = getAllUsers();

    const defaultData = [
        { username: 'admin', password: 'admin123', role: 'ADMIN' as UserRole }
    ];

    for (const data of defaultData) {
        if (!users.some(u => u.username === data.username)) {
            const newUser: User = {
                id: `user-${data.username.toLowerCase()}-${Date.now()}`,
                username: data.username,
                passwordHash: await hashPassword(data.password),
                role: data.role,
                registeredAddresses: [],
                createdAt: new Date().toISOString()
            };
            saveUser(newUser);
        }
    }
};

// Fee Configuration
export const getFeeConfig = (): FeeConfig => {
    const configJson = localStorage.getItem('jiahe_fee_config');
    if (configJson) {
        try {
            return JSON.parse(configJson);
        } catch {
            return DEFAULT_FEE_CONFIG as unknown as FeeConfig;
        }
    }
    return DEFAULT_FEE_CONFIG as unknown as FeeConfig;
};

export const saveFeeConfig = (config: FeeConfig): void => {
    localStorage.setItem('jiahe_fee_config', JSON.stringify(config));
};
