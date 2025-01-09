const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (backend)
admin.initializeApp();


exports.firestoreUpdateTrigger = functions.firestore
  .document('your-collection-name/{docId}')
  .onWrite(async (change, context) => {
    const db = admin.firestore();
    const documentRef = db.collection("your-collection-name").doc(context.params.docId);

    try {
      if (change.after.exists) {

        await documentRef.update({
          status: "Updated dynamically based on Firestore event",
        });
        console.log("Firestore document updated successfully.");
      }
    } catch (error) {
      console.error("Error updating Firestore: ", error);
    }
  });


exports.updateFirestoreHTTP = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const collectionRef = db.collection("your-collection-name");

  try {
    const snapshot = await collectionRef.get();
    if (snapshot.empty) {
      res.status(404).send("No documents found.");
      return;
    }

    snapshot.forEach(async (doc) => {
      await doc.ref.update({
        status: "Updated dynamically through HTTP trigger",
      });
    });

    res.status(200).send("Firestore documents updated successfully.");
  } catch (error) {
    console.error("Error updating Firestore: ", error);
    res.status(500).send("Error updating Firestore.");
  }
});


exports.pubsubUpdateFirestore = functions.pubsub
  .topic("your-topic-name")
  .onPublish(async (message) => {
    const db = admin.firestore();
    const collectionRef = db.collection("your-collection-name");

    try {
      const data = message.json; 
      const snapshot = await collectionRef.get();
      if (snapshot.empty) {
        console.log("No documents found in the collection.");
        return;
      }

      snapshot.forEach((doc) => {
        doc.ref.update({
          status: `Updated dynamically with Pub/Sub message: ${JSON.stringify(data)}`,
        });
      });

      console.log("Firestore documents updated successfully.");
    } catch (error) {
      console.error("Error updating Firestore: ", error);
    }
  });
