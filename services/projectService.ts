import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Project } from '../types';

const PROJECTS_COLLECTION = 'projects';

/**
 * Sanitize data for Firestore
 * - Removes undefined values
 * - Converts undefined to empty string for optional string fields
 * - Ensures arrays are clean
 */
const sanitizeForFirestore = (obj: any): any => {
    // Handle null/undefined
    if (obj === undefined) {
        return null;
    }
    if (obj === null) {
        return null;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== null);
    }

    // Handle objects
    if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (value === undefined) {
                // Skip undefined values entirely
                continue;
            }
            const sanitized = sanitizeForFirestore(value);
            if (sanitized !== null || key === 'description' || key === 'image' || key === 'url') {
                // Keep null only for optional string fields, otherwise skip
                cleaned[key] = sanitized === null ? '' : sanitized;
            }
        }
        return cleaned;
    }

    // Handle primitives (string, number, boolean)
    return obj;
};

/**
 * Deep clone and sanitize object using JSON parse/stringify
 * This ensures the object is fully serializable
 */
const cleanForFirestore = (obj: any): any => {
    try {
        // First, use JSON to remove any non-serializable data
        const jsonStr = JSON.stringify(obj, (key, value) => {
            if (value === undefined) return null;
            return value;
        });
        const parsed = JSON.parse(jsonStr);
        // Then sanitize for Firestore
        return sanitizeForFirestore(parsed);
    } catch (e) {
        console.error('Error cleaning data for Firestore:', e);
        return sanitizeForFirestore(obj);
    }
};

/**
 * Convert Firestore document to Project type
 */
const docToProject = (doc: any): Project => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    } as Project;
};

/**
 * Convert Project to Firestore document data
 * Sanitizes data to prevent Firestore errors
 */
const projectToDoc = (project: Partial<Project>) => {
    const { id, createdAt, ...rest } = project;
    return cleanForFirestore(rest);
};

/**
 * Get all projects
 */
export const getAllProjects = async (): Promise<Project[]> => {
    try {
        const q = query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docToProject);
    } catch (error) {
        console.error('Error getting projects:', error);
        throw error;
    }
};

/**
 * Get a single project by ID
 */
export const getProjectById = async (id: string): Promise<Project | null> => {
    try {
        const docRef = doc(db, PROJECTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docToProject(docSnap);
        }
        return null;
    } catch (error) {
        console.error('Error getting project:', error);
        throw error;
    }
};

/**
 * Create a new project
 */
export const createProject = async (project: Omit<Project, 'id'>): Promise<string> => {
    try {
        const projectData = {
            ...projectToDoc(project),
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
};

/**
 * Update an existing project
 */
export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    try {
        const docRef = doc(db, PROJECTS_COLLECTION, id);
        const updateData = projectToDoc(updates);
        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, PROJECTS_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
};

/**
 * Subscribe to real-time project updates
 * @param callback Function to call when projects change
 * @returns Unsubscribe function
 */
export const subscribeToProjects = (callback: (projects: Project[]) => void): (() => void) => {
    const q = query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
            const projects = querySnapshot.docs.map(docToProject);
            callback(projects);
        },
        (error) => {
            console.error('Error in projects subscription:', error);
        }
    );

    return unsubscribe;
};
