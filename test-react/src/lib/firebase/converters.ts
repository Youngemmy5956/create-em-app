import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from "firebase/firestore";

/**
 * Generic Firestore converter — type-safe reads and writes.
 *
 * Usage:
 *   const userConverter = createConverter<User>();
 *   const ref = doc(db, "users", id).withConverter(userConverter);
 */
export function createConverter<T extends DocumentData>() {
  return {
    toFirestore(data: WithFieldValue<T>): DocumentData {
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return snapshot.data(options) as T;
    },
  };
}
