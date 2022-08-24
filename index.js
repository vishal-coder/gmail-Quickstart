const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = [
  // "https://www.googleapis.com/auth/gmail.readonly",
  // "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.profile", // get user info
  "https://www.googleapis.com/auth/userinfo.email", // get user email ID and if its verified or not
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
  const client_secret = credentials.client_secret;
  const client_id = credentials.client_id;
  const redirect_uris = credentials.redirect_uris;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, "utf-8", async (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    console.log("-------", token);
    console.log("-------", JSON.parse(token).access_token);
    console.log("----token.access_token---", token.access_token);
    oAuth2Client.setCredentials(JSON.parse(token));
    ///---------------------

    let oauth2Client = new google.auth.OAuth2(); // create new auth client
    oauth2Client.setCredentials({
      access_token: JSON.parse(token).access_token,
    }); // use the new auth client with the access_token
    let oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    console.log("now calling get user profile");
    let { data } = await oauth2.userinfo.get(); // get user info
    console.log("user profile is---", data);
    //-------------------------
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getNewToken(oAuth2Client, callback) {
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
    oAuth2Client.getToken(code, async (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);

      ///---------------------

      let oauth2Client = new google.auth.OAuth2(); // create new auth client
      oauth2Client.setCredentials({ access_token: token.access_token }); // use the new auth client with the access_token
      // let oauth2 = google.oauth2({
      //   auth: oauth2Client,
      //   version: "v2",
      // });
      // console.log("now calling get user profile");
      // let { data } = await oauth2.userinfo.get(); // get user info
      // console.log("user profile is 2 ", data);
      //-------------------------

      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
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
async function listLabels(auth) {
  let mlist = null;
  let mailList = [];
  // const gmail = google.gmail({ version: "v1", auth });
  // var gmail = google.gmail({
  //   auth: auth,
  //   version: "v1",
  // });
  // gmail.users.getProfile(
  //   {
  //     auth: auth,
  //     userId: "me",
  //   },
  //   function (err, res) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log("inside else of get profile");
  //       console.log("emailAddress", res.data.emailAddress);
  //       console.log(JSON.stringify(res));
  //     }
  //   }
  // );
  // gmail.users.labels.list(
  //   {
  //     userId: "me",
  //   },
  //   (err, res) => {
  //     if (err) return console.log("The API returned an error: " + err);
  //     const labels = res.data.labels;
  //     if (labels.length) {
  //       console.log("Labels:");
  //       labels.forEach((label) => {
  //         console.log(`- ${label.name}`);
  //       });
  //     } else {
  //       console.log("No labels found.");
  //     }
  //   }
  // );
  var gmail = google.gmail({
    auth: auth,
    version: "v1",
  });
  const res = await gmail.users.messages.list({
    // The user's email address. The special value `me` can be used to indicate the authenticated user.
    userId: "me",
    labelIds: "INBOX",
  });
  mlist = res.data.messages;
  console.log("mlist is---", res.data.messages);

  mlist.forEach(async function (mail) {
    // const res = await getmail(gmail, mail.id);
    const res = await gmail.users.messages.get({
      userId: "me",
      id: mail.id,
      format: "metadata",
    });
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const starred = res.data.labelIds.includes("STARRED");
    const snippet = res.data.snippet;
    let from;
    let date;

    res.data.payload.headers.map(function (header) {
      if (header.name == "From") {
        console.log(
          "header object is",
          header.value.substring(0, header.value.indexOf("<"))
        );
        from = header.value.substring(0, header.value.indexOf("<"));
      }
      if (header.name == "Date") {
        console.log("rawDate", header.value);
        const rawDate = new Date(header.value);
        console.log("rawDate", rawDate);
        date = `${rawDate.getDate()} ${monthNames[rawDate.getMonth()]}`;
      }
    });
    console.log("resonse in push list is", starred, from, snippet, date);
    const mailData = {
      isStarred: starred,
      from: from,
      snippet: snippet,
      date: date,
    };

    //  console.log("resonse in push list is", res);
    mailList.push(mailData);
    //  console.log("mailList--ind foreach", mailList);
  });

  console.log("mailList--end", mailList);
  // gmail.users.messages.get(
  //   {
  //     userId: "me",
  //     id: "182c3b7839fc2c09",
  //     format: "raw",
  //   },
  //   function (err, res) {
  //     // console.log(new Buffer.alloc(res.raw, "base64").toString());
  //     //  console.log(Buffer.from(res.data.raw, "base64").toString());
  //     //console.log(res.data.raw);
  //   }
  // );
}
async function getmail(gmail, id) {
  const res = await gmail.users.messages.get({
    userId: "me",
    id: id,
    format: "metadata",
  });
  console.log("at end", res);
  return res.data.labelIds;
}
