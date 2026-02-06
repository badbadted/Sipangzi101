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
 */
const projectToDoc = (project: Partial<Project>) => {
    const { id, createdAt, ...rest } = project;
    return rest;
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
