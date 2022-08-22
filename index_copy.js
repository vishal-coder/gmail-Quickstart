const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.modify",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  // const { , client_id, redirect_uris } = credentials.installed;
  const client_secret = credentials.client_secret;
  const client_id = credentials.client_id;
  const redirect_uris = credentials.redirect_uris;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, tokens) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(tokens);
      console.log("received token is", tokens);
      const gmail = google.gmail({ version: "v1", oAuth2Client });
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  // getGoogleUser(auth);
  var gmail = google.gmail({
    auth: auth,
    version: "v1",
  });

  const authClient = await auth.getClient();
  google.options({ auth: authClient });

  // Do the magic
  const res = await gmail.users.getProfile({
    // The user's email address. The special value `me` can be used to indicate the authenticated user.
    userId: "me",
  });
  console.log(res.data);

  gmail.users.messages.list(
    {
      auth: auth,
      userId: "me",
      query: "label:inbox subject:reminder",
    },
    function (err, res) {
      if (err) {
        console.log(err);
      } else {
        console.log("inside else of get profile");
        console.log(JSON.stringify(res));
      }
    }
  );

  // const gmail = google.gmail({ version: "v1", auth });
  gmail.users.labels.list(
    {
      userId: "me",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const labels = res.data.labels;
      if (labels.length) {
        console.log("Labels:");
        labels.forEach((label) => {
          console.log(`- ${label.name}-${label.id}`);
        });
      } else {
        console.log("No labels found.");
      }
    }
  );
}

