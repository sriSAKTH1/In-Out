import type { FeedbackSubmission } from '../types';
import { db, isFirebaseConfigured, collection, addDoc, getDocs, query, orderBy } from './firebase';
import { storage } from '../data/storage';

export const feedbackService = {
  submitFeedback: async (
    fb: Omit<FeedbackSubmission, 'id' | 'created_at'> & { created_at?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    const feedbackItem: FeedbackSubmission = {
      id: `fb_${Date.now()}`,
      rating: fb.rating,
      category: fb.category,
      message: fb.message,
      user_name: fb.user_name || 'Anonymous User',
      user_email: fb.user_email || '',
      created_at: fb.created_at || new Date().toISOString(),
    };

    // Save to local storage
    const currentLocal = storage.getFeedbacks();
    storage.saveFeedbacks([feedbackItem, ...currentLocal]);

    // Push to Cloud Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'feedbacks'), {
          ...feedbackItem,
          submitted_at_server: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firestore feedback submission warning:', err);
      }
    }

    return { success: true, message: 'Feedback submitted successfully!' };
  },

  getAllFeedbacks: async (): Promise<FeedbackSubmission[]> => {
    const localFeedbacks = storage.getFeedbacks();

    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'feedbacks'), orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        const remoteFeedbacks: FeedbackSubmission[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteFeedbacks.push({
            id: docSnap.id,
            rating: data.rating || 5,
            category: data.category || 'feature',
            message: data.message || '',
            created_at: data.created_at || new Date().toISOString(),
            user_name: data.user_name || 'User',
            user_email: data.user_email || '',
          });
        });

        if (remoteFeedbacks.length > 0) {
          return remoteFeedbacks;
        }
      } catch (err) {
        console.warn('Firestore feedback fetch warning:', err);
      }
    }

    return localFeedbacks;
  },
};
