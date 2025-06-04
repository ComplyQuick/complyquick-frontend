import { jwtDecode } from "jwt-decode";

const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const REFRESH_TOKEN = import.meta.env.VITE_GOOGLE_DRIVE_REFRESH_TOKEN;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_DRIVE_REDIRECT_URI;

console.log("client_id", CLIENT_ID);
console.log("client_secret", CLIENT_SECRET);
console.log("refresh_token", REFRESH_TOKEN);
console.log("redirect_uri", REDIRECT_URI);

async function getAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  return data.access_token;
}

export const uploadCertificateToDrive = async (
  certificateBuffer: ArrayBuffer,
  fileName: string
) => {
  try {
    const accessToken = await getAccessToken();

    // First, create the file metadata
    const metadata = {
      name: fileName,
      parents: [FOLDER_ID],
      mimeType: "image/png",
    };

    // Create the file
    const createResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(metadata),
      }
    );

    const fileData = await createResponse.json();
    const fileId = fileData.id;

    // Upload the file content
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "image/png",
        },
        body: certificateBuffer,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file content");
    }

    // Set file permission so anyone with the link can view
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }
    );

    // Get the file's web view link
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const fileInfo = await fileResponse.json();
    console.log(
      "Certificate uploaded successfully. URL:",
      fileInfo.webViewLink
    );
    return fileInfo.webViewLink;
  } catch (error) {
    console.error("Error uploading certificate to Google Drive:", error);
    throw error;
  }
};
