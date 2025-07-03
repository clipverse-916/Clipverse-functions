const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.triggerClipverseWorkflow = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    if (!filePath.startsWith("uploads/")) return;

    const userId = filePath.split("/")[1];
    const fileUrl = `gs://${object.bucket}/${filePath}`;

    const db = admin.firestore();
    const jobsRef = db.collection("jobs")
                      .where("user_id", "==", userId)
                      .where("status", "==", "uploaded")
                      .limit(1);
    const snapshot = await jobsRef.get();
    if (snapshot.empty) return;

    const jobDoc = snapshot.docs[0];
    const jobData = jobDoc.data();
    const stylePrompt = jobData.style_prompt;

    await axios.post("https://hook.us2.make.com/t6mtxbyqtun69mtgqvo7fapehp84ms4b", {
      user_id: userId,
      video_url: fileUrl,
      style_prompt: stylePrompt,
      job_id: jobDoc.id
    });
  });
