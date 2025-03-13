let accessToken;
let accessTokenExpirationTime;

// Function to get access token
async function reinitializeAccessToken() {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events.readonly'], // Adjust scopes as needed
    });
  
    console.log('Authorize this app by visiting this url:', authUrl);
    // After visiting the URL, the user will be redirected to your redirect URI with a code
    // You need to capture that code and exchange it for tokens
  }
  
  
  // After getting the code from the redirect URI
  async function getToken(code) {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log('Tokens acquired:', tokens);
    return tokens; // Return the tokens for further use
  }
  
  
  async function refreshAccessToken() {
    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      console.log('New Access Token:', credentials.access_token);
      accessToken = credentials.access_token;
      accessTokenExpirationTime = credentials.expiry_date;
  
      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
    }
  }
  
  async function initAuthorization(accessToken) {
  
    // authorization code: 4/0AVG7fiQqWoAu0eabBdrmtAjU4LkkWfIn6zq-wpku753xSxXb34BpUZuzMuL5tNgGkvPtVQ
    // refresh token: 1//04A8HsHAM14iWCgYIARAAGAQSNwF-L9IrcXVi-0Lr1FSKgiZiWpaj0dO-DF2LvnOlEes3Lj4PqzAV9S4trh60-Thg7Qfqaru8lFE
  
    try {
      // const tokens = await getToken(code); // Call getToken to exchange the code for tokens
      // oAuth2Client.setCredentials(tokens); // Set the credentials for the OAuth2 client
  
      oAuth2Client.setCredentials({
        refresh_token: grefreshtoken,
        access_token: accessToken //"ya29.a0AcM612wMqPrMVBgvuQOU20HDnTjH7Irhj3gu1byBOMibgpbSWH4ouIaXhrPwM8GkrSMLF2KCv76474DzmXorhE-B_c3NVIyIkuoSfXZrYnqiU5rUtmbDrDFa2n17g6FMob-kgKR0BQJYAzXJWioIwBedzO6tChfnUUJrd7yHaCgYKAQ4SARASFQHGX2MisQ0bmwpkSPblv5WtOXmFFg0175"
      })
      // You can now use the oAuth2Client to make API calls
    } catch (error) {
      console.error('Error retrieving access token', error);
    }
  };
  
  async function getAccessToken() {
    if (!accessToken || Date.now() >= accessTokenExpirationTime) {
      // If the access token is not set or has expired, refresh it
      accessToken = await refreshAccessToken();
      // Set the expiration time to 1 hour from now
      accessTokenExpirationTime = Date.now() + 3600 * 1000; // 1 hour in milliseconds
  
      initAuthorization(accessToken);
    }
    return accessToken;
  }
  





// reinitializeAccessToken();
// manual authorization
// const accToken = "ya29.a0AcM612wOIGjD7Z4_HdmvWbHpHnIKbklwgXJYJepg4sQnRB3qgWioWX1mDxOBlZTnej3BdIPxoWUfn8gv_hkiybKJIqLkeQXH0dQk7wmCNW5XshjjnH2I4NYt9m-r_cJWP3HbikRi6iyJDrhRUAj0GhVwk2vJG2SYCCMYVzxaaCgYKAbESARASFQHGX2MipbwRWI4_RNdMJMkLK1oQAA0175"
// initAuthorization(accToken);

// automated authorization
// oAuth2Client.setCredentials({
//   refresh_token: grefreshtoken,
// });

// refreshAccessToken().then((newAccessToken) => {
//   initAuthorization(newAccessToken);
// });