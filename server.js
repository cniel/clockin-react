import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import sqlite3 from 'sqlite3';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import cors from 'cors'; // Import cors
import crypto from 'crypto';
import moment from 'moment-timezone';
import axios from 'axios';
import { group } from 'console';
const app = express();

const port = 3000;

app.use(express.json());
app.use(cors()); // Use cors middleware

// SQLITE3 database
const db = new sqlite3.Database('./data/clockin.db'); // Change this path as needed

const api_key = "AIzaSyDh_23gFH-oYNTwr5LfHzToeYwXDWM7vsM" // google api key


// Create tables if they don't exist
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS etudiants (etudiantid TEXT PRIMARY KEY, nom TEXT NOT NULL, prenom TEXT, designationlong TEXT)")
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, etudiantid TEXT NOT NULL, email TEXT UNIQUE, password TEXT, first_name TEXT, last_name TEXT, promotion TEXT, group_name TEXT, is_admin INTEGER DEFAULT 0)");
  db.run("CREATE TABLE IF NOT EXISTS clockins (id INTEGER PRIMARY KEY, user_id INTEGER, email TEXT, event_id TEXT, event_name TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
  db.run("CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY, user_id INTEGER, token TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
  db.run("CREATE TABLE IF NOT EXISTS cliclocks(event_id TEXT PRIMARY KEY NOT NULL, etudiantid TEXT NOT NULL, status TEXT NOT NULL)");

  // Ajouter un administrateur par défaut
  const adminEmail = "admin@idheo.com";
  const adminPassword = bcrypt.hashSync(process.env.ADMIN_ACCESS_CODE, 8); // Mot de passe par défaut
  db.run(
    "INSERT OR IGNORE INTO users (etudiantid, email, password, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
    ["admin", adminEmail, adminPassword, "Admin", "User", 1]
  );
});

const getCalendarUrl = (promotion) => {
  const agenda_ids = {
    "P1": "uq4s0969b5tbpm3eld34m7qiho@group.calendar.google.com",
    "P2": "5gqrig13o56rltik5oc3h0kjds@group.calendar.google.com",
    "P3": "amqdq7rt8fr3kcoevlahsempq0@group.calendar.google.com",
    "D1": "rd1pbji735mnahkrhigvc9qjlg@group.calendar.google.com",
    "D2": "9i12it26qlrbmo5gosl2722ps8@group.calendar.google.com",
    "AC": "ad5c2unm2ed4b5ul3qbodd1eeg@group.calendar.google.com"
  }

  return "https://www.googleapis.com/calendar/v3/calendars/" + agenda_ids[promotion] +"/events?key=" + api_key
}

const getCalendarEventUrl = (promotion, eventId) => {
  const agenda_ids = {
    "P1": "uq4s0969b5tbpm3eld34m7qiho@group.calendar.google.com",
    "P2": "5gqrig13o56rltik5oc3h0kjds@group.calendar.google.com",
    "P3": "amqdq7rt8fr3kcoevlahsempq0@group.calendar.google.com",
    "D1": "rd1pbji735mnahkrhigvc9qjlg@group.calendar.google.com",
    "D2": "9i12it26qlrbmo5gosl2722ps8@group.calendar.google.com",
    "AC": "ad5c2unm2ed4b5ul3qbodd1eeg@group.calendar.google.com"
  }

  return "https://www.googleapis.com/calendar/v3/calendars/" + agenda_ids[promotion] +"/events/" + eventId + "?key=" + api_key
}


const formatDate = (date) => date.toLocaleDateString('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatTime = (date) => date.toLocaleTimeString('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).replace(':', 'h');


const getStartOfSchoolYear = () => {
  let startOfSchoolYear;
  const now = new Date(); // Note: Month is zero-based (0 = January, 11 = December)
  if (now.getMonth() >= 7 && now.getMonth() <= 11) { // Between August (7) and December (11)
    startOfSchoolYear = new Date(now.getFullYear(), 7, 10); // August 20 of the current year
  } else { // Between January (0) and July (6)
    startOfSchoolYear = new Date(now.getFullYear() - 1, 7, 10); // August 20 of the previous year
  }

  return startOfSchoolYear.toISOString();
}

// Generate a random password
const generatePassword = () => Math.random().toString(36).slice(-8);

// Send email
const sendEmail = (email, password) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'niel.clement@gmail.com',
      pass: "lucvmzjzvkccfbrh"
    }
  });

  console.log("Password generated: ", password)
  const mailOptions = {
    from: 'niel.clement@gmail.com',
    to: email,
    subject: 'Mot de passe IDHEO',
    text: `Inscription à l'application de saisie de temps réussie !
Mot de passe de connexion : ${password}

IdHEO
Adresse : 15 bd Marcel Paul
44800 Saint-Herblain
https://www.idheo.com
`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Email sent: ' + info.response);
  });
};

const getEmailByEtuId = async(db, etudiantid) => {
  // get email from etudiantid
  let studentEmail = await new Promise((resolve, reject) => {
    db.get('SELECT email FROM users WHERE etudiantid = ?', [etudiantid], (err, row) => {
      if (err) reject(err);
      resolve(row ? row.email : null);
    });
  });

  if (!studentEmail) {
    studentEmail = ''
  }
  return studentEmail;
}

const getStudentById = async(db, id) => {
  const student = await new Promise((resolve, reject) => {
    db.get('SELECT e.*, u.email, u.group_name FROM etudiants e LEFT JOIN users u ON e.etudiantid = u.etudiantid WHERE e.etudiantid = ?', [id], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });

  return student;
}

const fetchEvent = async (promotion, eventId) => {
  const eventDetailsUrl = getCalendarEventUrl(promotion, eventId)
  const response = await axios.get(eventDetailsUrl);
  const event = response.data;
  return event;
}

// Fetch events (lessons) from the calendar
const fetchEventsByDateRange = async (promotion, startDatetime, endDatetime) => {
  try {
    let calendarUrl = getCalendarUrl(promotion);
    if (startDatetime) calendarUrl += `&timeMin=${encodeURIComponent(startDatetime)}`;
    if (endDatetime) calendarUrl += `&timeMax=${encodeURIComponent(endDatetime)}`;

    console.log("startDatetime : ", startDatetime)
    console.log("endDatetime : ", endDatetime)
    calendarUrl += '&orderBy=startTime&singleEvents=true';

    let allEvents = [];
    let nextPageToken = null;

    do {
      let url = calendarUrl;
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }

      const response = await axios.get(url);
      if (response.status !== 200) {
        console.error('Error fetching calendar events:', response.statusText);
        return [];
      }

      allEvents = allEvents.concat(response.data.items);
      nextPageToken = response.data.nextPageToken;

    } while (nextPageToken);

    console.log('Total events fetched:', allEvents.length);
    return allEvents;
  } catch (error) {
    console.error('Error fetching lessons from Google Calendar:', error);
    return [];
  }
};


const getNow = () => {
  return moment().tz('Europe/Paris');
}

// Function to fetch events from Google Calendar
const fetchCalendarEvents = async (promotion) => {
  let calendarUrl = getCalendarUrl(promotion);

  // const startOfDay = moment().tz('Europe/Paris').startOf('day').format();
  // const endOfDay = moment().tz('Europe/Paris').endOf('day').format();
  
  const now = getNow();
  const startOfDay = now.startOf('day').format();
  const endOfDay = now.endOf('day').format();

  calendarUrl += `&timeMin=${encodeURIComponent(startOfDay)}`;
  calendarUrl += `&timeMax=${encodeURIComponent(endOfDay)}`;
  calendarUrl += '&orderBy=startTime&singleEvents=true';

  const response = await axios.get(calendarUrl);

  return response.data.items;
};

// Function to fetch events from Google Calendar
const fetchCalendarEventsWholeYearByGroup = async (promotion, groupName, isMidyear=true) => {

  const now = new Date().toISOString(); // Current date and time
  const startMidYear = moment("2025-03-23 23:59:59").tz('Europe/Paris');
  
  let startDate = isMidyear ? startMidYear.toISOString() : getStartOfSchoolYear(); 
  const events = await fetchEventsByDateRange(promotion, startDate, now);

  const relevantEvents = getRelevantEvents(events, groupName, false);

  console.log("relevantEvents: ", relevantEvents.length)
  // Sort events by start date
  relevantEvents.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));

  return relevantEvents;
};

const fetchCalendarEventsWholeYear = async (promotion, isMidyear=true) => {
  const now = new Date().toISOString(); // Current date and time
  const groups = ["Gr1", "Gr2", "Gr3", "Gr4"];
  let eventsByGroup = {};

  
  const startMidYear = moment("2025-03-23 23:59:59").tz('Europe/Paris');
  
  let startDate = isMidyear ? startMidYear.toISOString() : getStartOfSchoolYear(); 
  const events = await fetchEventsByDateRange(promotion, startDate, now);

  for (let group of groups) {
    const relevantEvents = getRelevantEvents(events, group, false);

    // Sort events by start date
    relevantEvents.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));

    eventsByGroup[group] = relevantEvents;
  }

  return eventsByGroup;
};

const filterOngoingEvents = (events) => {
  let now = getNow(); //moment.tz('2025-03-13 14:45', 'Europe/Paris');  // Current time in France

  return events.filter(event => {
    const eventStart = moment(event.start.dateTime);
    // const eventEnd = moment(event.end.dateTime);
    return now.isBetween(eventStart.subtract(2, 'minutes'), eventStart.add(14, 'minutes'));  // Check if current time is between event start and 10 minutes after
  });
}

const matchGroup = (input, text) => {
  if (!input || !text) return false; // Vérifiez que les arguments sont définis

  const numberMatch = input.match(/\d+/); // Extraction du nombre dans "Gr2"
  if (!numberMatch) return false; // Pas de nombre dans l'input

  const number = numberMatch[0]; // Le numéro extrait (ex: "2")

  // Regex pour trouver des groupes "GrX", "GrX-Y", etc.
  const regex = new RegExp(`Gr[\\d-]*${number}[\\d-]*\\b`, "g");

  return regex.test(text);
}

const getRelevantEvents = (events, group_name, ongoingEventsFilter=true) => {
  const eventsToFilter = ongoingEventsFilter ? filterOngoingEvents(events) : events;
  
  return eventsToFilter.filter(event => {

    const titleIncludesGroup = matchGroup(group_name, event.summary);
    const descriptionIncludesGroup = event.description && matchGroup(group_name, event.description);
    if (titleIncludesGroup || descriptionIncludesGroup) {
      return true;
    }

    // Check if the event is associated with other groups or the whole promotion
    const otherGroupsInTitle = event.summary.matchAll(/Gr\d+/g);
    const otherGroupsInDescription = event.description ? event.description.matchAll(/Gr\d+/g) : [];

    const otherGroups = [...(otherGroupsInTitle || []), ...(otherGroupsInDescription || [])];
    if (otherGroups.length > 0) {
      return false;
    }

    return true;
  });
};

const getClockInsByUserIdForCurrentScoolYear = async (db, userId) => {

  const now = new Date().toISOString(); // Current date and time
  const startOfSchoolYear = getStartOfSchoolYear();

  const clockins = await new Promise((resolve, reject) => {
    try {
      //const q = "SELECT DISTINCT event_id FROM clockins WHERE user_id = '" + userId + "' AND timestamp BETWEEN '" + startOfSchoolYear  + "' AND '" + now + "'"
      //db.all(q, (err, rows) => {
      db.all('SELECT DISTINCT c.event_id FROM clockins c LEFT JOIN cliclocks cli ON c.event_id = cli.event_id AND c.user_id = cli.etudiantid WHERE c.user_id = ? AND c.timestamp BETWEEN ? AND ? AND cli.event_id IS NULL', [userId, startOfSchoolYear, now], (err, rows) => {
        if (err) {
          return reject(err);
        }

        resolve(rows);
      });
    } catch (error) {
      console.error('Error fetching clockins:', error);
      reject(error);
    }
  });

  return clockins;
}

// // Function to get clock-in records for events
// const getClockInsForEvents = async (db, events) => {

//   const clockins = await Promise.all(events.map(event =>
//     new Promise((resolve, reject) => {
//       db.get('SELECT * FROM clockins INNER JOIN users ON clockins.user_id=users.id WHERE event_id = ?', event.id, (err, rows) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(rows); // Return the row for this event
//       });
//     })
//   ));

//   return clockins.flat();
// }

// const getClockInsForEventsByUserId = async(db, events, userId) => {

//   const clockins = await Promise.all(events.map(event =>
//     new Promise((resolve, reject) => {
//       db.get('SELECT * FROM clockins WHERE event_id = ? and user_id = ?', event.id, userId, (err, rows) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(rows); // Return the row for this event
//       });
//     })
//   ));

//   return clockins.flat();
// }

// Function to delete clockin from the database
const deleteClockin = async (etudiantid, eventId) => {
  // Replace with your database logic
  // Example using a hypothetical database function
  await db.run('DELETE FROM clockins WHERE user_id = ? AND event_id = ?', [etudiantid, eventId]);
}

const getStudentsByPromotion = async (db, promotion) => {
  const students = await new Promise((resolve, reject) => {
    db.all('SELECT e.nom, e.prenom, e.etudiantid, u.group_name FROM etudiants e LEFT JOIN users u on u.etudiantid = e.etudiantid where designationlong=? ORDER BY nom', promotion, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });

  return students;
}

// Function to fetch the next event for a user
const fetchNextEvent = async (promotion) => {
  const now = new Date().toISOString(); // Current date and time
  let calendarUrl = getCalendarUrl(promotion) 
  calendarUrl += `&timeMin=${encodeURIComponent(now)}`
  calendarUrl += '&orderBy=startTime&singleEvents=true&maxResults=1';

  try {
    const response = await axios.get(calendarUrl);
    const events = response.data.items;

    if (events.length > 0) {
      return events[0]; // Return the next event
    } else {
      return null; // No upcoming events
    }
  } catch (error) {
    console.error('Error fetching next event from Google Calendar:', error);
    return null;
  }
};

// // Function to fetch events for a specific day
// const fetchEventsForDay = async(date, promotion) => {

//   const startOfDay = new Date(date);
//   const endOfDay = new Date(date);
//   endOfDay.setDate(startOfDay.getDate() + 1); // End of the day

//   let calendarUrl = getCalendarUrl(promotion);
//   calendarUrl += `&timeMin=${encodeURIComponent(startOfDay)}`;
//   calendarUrl += `&timeMax=${encodeURIComponent(endOfDay)}`;
//   calendarUrl += '&orderBy=startTime&singleEvents=true';
  
//   const response = await axios.get(calendarUrl);

//   return response.data.items;
// }

// const countAbsencesByPromotion = async (events, promotion) => {
//   const studentAbsences = {};

//   // Fetch all students from your database
//   const students = await getStudentsByPromotion(db, promotion);

//   // Initialize absence counts for each student
//   students.forEach(student => {
//     studentAbsences[student.etudiantid] = {
//       name: student.nom + " " + student.prenom,
//       absence_count: 0
//     };
//   });

//   // Get all events with students who clocked in
//   const clockIns = await getClockInsForEvents(db, events);
//   // Combine events with clock-in records
//   const eventsWithClockIns = events.map(event => ({
//     ...event,
//     clockIns: clockIns.filter(clockIn => clockIn != null ? clockIn.event_id === event.id : false),
//   }));

//   // for each event: for each student: count abscence
//   eventsWithClockIns.map((eventWithClockIns) => {
//     const studentsWhoClockedIn = eventWithClockIns.clockIns.map(ci => ci.etudiantid);
//     students.forEach(student => {
//       const relevantEvents = getRelevantEvents([eventWithClockIns], student.group_name);
//       if (relevantEvents.length > 0 && !studentsWhoClockedIn.includes(student.etudiantid)) {
//         studentAbsences[student.etudiantid].absence_count++;
//       }
//     });
//   });

//   return studentAbsences;
// }

// const listAbsencesByUser = async (events, etudiantid) => {
//   try {
//     console.log("etudiantid : ", etudiantid)
//     const student = await new Promise((resolve, reject) => {
//       db.get('SELECT etudiants.*, email FROM etudiants LEFT join users ON etudiants.etudiantid = users.etudiantid WHERE etudiants.etudiantid=?', etudiantid, (err, student) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(student);
//         }
//       });
//     });

//     if (!student) {
//       throw new Error('Student not found');
//     }

//     let studentPresenceSheet = []; // [{matiere_attribute: any, present: boolean},]

//     // Get all events with students who clocked in
//     // const clockIns = await getClockInsForEvents(db, events);
//     const clockIns = await getClockInsForEventsByUserId(db, events, etudiantid);

//     // Combine events with clock-in records
//     const eventsWithClockIns = events.map(event => ({
//       ...event,
//       clockIns: clockIns.filter(clockIn => clockIn != null ? clockIn.event_id === event.id : false),
//     }));

//     // for each event: count student absence
//     eventsWithClockIns.forEach((eventWithClockIns) => {
//       const studentsWhoClockedIn = eventWithClockIns.clockIns.map(ci => ci.etudiantid);
//       const wasPresent = studentsWhoClockedIn.includes(student.etudiantid);
//       studentPresenceSheet.push({
//         'eventId': eventWithClockIns.id,
//         'eventTitle': eventWithClockIns.summary,
//         'start': `${formatDate(new Date(eventWithClockIns.start.dateTime))} ${formatTime(new Date(eventWithClockIns.start.dateTime))}`,
//         'end': `${formatDate(new Date(eventWithClockIns.end.dateTime))} ${formatTime(new Date(eventWithClockIns.end.dateTime))}`,
//         'was_present': wasPresent
//       });
//     });

//     return studentPresenceSheet;
//   } catch (error) {
//     console.error('Error in listAbsencesByUser:', error);
//     throw error;
//   }
// };



// Middleware to check admin access code
const checkAdminAccess = (req, res, next) => {
  const accessCode = req.headers['x-access-code'];
  const validAccessCode = process.env.ADMIN_ACCESS_CODE;

  if (accessCode === validAccessCode) {
    next(); // Access granted, proceed to the next middleware or route handler
  } else {
    res.status(403).send('Forbidden: Invalid access code');
  }
};

// ----------------------------------------------
// BELOW : API ENDPOINTS
// ----------------------------------------------

// Register user
app.post('/register', (req, res) => {
  const { firstName, lastName, email, promotion, group, userId } = req.body;
  const password = generatePassword();
  const hashedPassword = bcrypt.hashSync(password, 8);

  if (email === "niel.clement@gmail.com") {
    db.run("INSERT INTO users (etudiantid, email, password, first_name, last_name, promotion, group_name) VALUES (?, ?, ?, ?, ?, ?, ?)", [userId, email, hashedPassword, firstName, lastName, promotion, group], function (err) {
      if (err) {
        return res.status(400).send("User already exists");
      }
      sendEmail(email, password);
      res.status(200).send("User registered and password sent");
    });
  } else {
    // Insert user ID, email, password, promotion, and group into users table
    db.run("INSERT INTO users (etudiantid, email, password, first_name, last_name, promotion, group_name) VALUES (?, ?, ?, ?, ?, ?, ?)", [userId, email, hashedPassword, firstName, lastName, promotion, group], function (err) {
      if (err) {
        return res.status(400).send("User already exists");
      }
      sendEmail(email, password);
      res.status(200).send("User registered and password sent");
    });
  }
});

// Login user
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err || !row || !bcrypt.compareSync(password, row.password)) {
      return res.status(400).send("Invalid email or password");
    }

    // Vérifiez si l'utilisateur est un administrateur
    if (row.is_admin) {
      const token = crypto.randomBytes(16).toString('hex');
      db.run("INSERT INTO sessions (user_id, token) VALUES (?, ?)", [row.etudiantid, token], function (err) {
        if (err) {
          return res.status(500).send("Error creating session");
        }
        return res.status(200).send({ message: "Admin login successful", token });
      });
    } else {
      // Logique pour les utilisateurs non administrateurs
      const userId = row.user_id;

      // Check for active sessions
      db.get("SELECT * FROM sessions WHERE user_id = ?", [userId], (err, session) => {
        if (session) {
          console.log("already logged in")
          return res.status(400).send("User already logged in from another device");
        }

        // Generate a token
        const token = crypto.randomBytes(16).toString('hex');

        // Store the session
        db.run("INSERT INTO sessions (user_id, token) VALUES (?, ?)", [userId, token], function (err) {
          if (err) {
            console.log("error creating session")
            return res.status(500).send("Error creating session");
          }

          return res.status(200).send({ message: "Login successful", token });
        });
      });
    }
    
  });
});

// Logout user
app.post('/logout', (req, res) => {
  const { token } = req.body;

  db.run("DELETE FROM sessions WHERE token = ?", [token], function (err) {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.status(200).send("Logout successful");
  });
});

// Clock in
app.post('/clockin', (req, res) => {
  const { email, eventId, eventSummary, isCli } = req.body;
  
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err || !row) {
      return res.status(400).send("User not found");
    }

    console.log("row : ", row)
    console.log("isCli : ", isCli)

    db.run("INSERT INTO clockins (user_id, email, event_id, event_name) VALUES (?, ?, ?, ?)", [row.etudiantid, email, eventId, eventSummary], function (err) {
      if (err) {
        return res.status(500).send("Error clocking in");
      } else if(isCli) {
        db.run("INSERT INTO cliclocks (event_id, etudiantid, status) VALUES (?, ?, ?)", [eventId, row.etudiantid, "pending"], function (err) {
          if (err) {
            return res.status(500).send("Error clocking in");
          }
        });
      }
      res.status(200).send("Clocked in successfully");
    });
  });
});

app.post('/mark-as-completed', (req, res) => {
  const { email, eventId } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err || !row) {
      return res.status(400).send("User not found");
    }

    db.run("DELETE FROM cliclocks WHERE event_id = ? AND etudiantid = ?", [eventId, row.etudiantid], function (err) {
      if (err) {
        return res.status(500).send("Error marking event as completed");
      }
      res.status(200).send("Event marked as completed");
    });
  });
});

app.post('/loadallevents', (req, res) => {
  const { email } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err || !row) {
      return res.status(400).send("User not found");
    }

    const promotion = row.promotion;
    const group_name = row.group_name;
    fetchCalendarEvents(promotion).then(events => {
      res.status(200).send({ message: "fetchCalendarAllEvents", events });
    });
  });
});

// fetch relevant events at the curent time
app.post('/loadevents', (req, res) => {
  const { email } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) {
      return res.status(400).send("User not found");
    }

    const promotion = user.promotion;
    const group_name = user.group_name;

    // Fetch calendar events for the user's promotion
    fetchCalendarEvents(promotion).then(events => {
      const relevantEvents = getRelevantEvents(events, group_name);

      res.status(200).send({ message: "fetchCalendarEvents", events: relevantEvents });
    }).catch(error => {
      console.error("Error fetching calendar events:", error);
      res.status(500).send({ message: "Error fetching calendar events", error });
    });
  })
});

// Endpoint to get the next event for a user
app.get('/nextEvent', async (req, res) => {
  const { email } = req.query; // Get the email from the query parameters

  // Check if email is provided
  if (!email) {
    return res.status(400).send("Email is required");
  }

  try {
    // Get the user's promotion from the database
    db.get("SELECT promotion FROM users WHERE email = ?", [email], async (err, row) => {
      if (err || !row) {
        return res.status(400).send("User not found");
      }

      const promotion = row.promotion;
      const nextEvent = await fetchNextEvent(promotion);

      if (nextEvent) {
        res.status(200).json(nextEvent);
      } else {
        res.status(404).send("No upcoming events found");
      }
    });
  } catch (error) {
    console.error('Error fetching next event:', error);
    res.status(500).send('Error fetching next event');
  }
});

// Get clocked-in events for a specific user
app.get('/clockedInEvents', (req, res) => {
  const { email } = req.query; // Get the email from the query parameters

  // Check if email is provided
  if (!email) {
    return res.status(400).send("Email is required");
  }

  // Query the clockins table to get clocked-in events for the user
  db.all("SELECT event_id FROM clockins WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("Error fetching clocked-in events:", err);
      return res.status(500).send("Error fetching clocked-in events");
    }

    // Extract event IDs from the rows
    const clockedInEventIds = rows.map(row => row.event_id);

    // Send the list of clocked-in event IDs as the response
    res.status(200).json(clockedInEventIds);
  });
});

app.get('/pendingEvents', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send("Email is required");
  }

  // Query the clockins table to get clocked-in events for the user
  db.all("SELECT event_id FROM cliclocks c INNER JOIN users u on u.etudiantid = c.etudiantid WHERE u.email = ?", [email], (err, rows) => {
    if (err) {
      console.error("Error fetching clocked-in events:", err);
      return res.status(500).send("Error fetching clocked-in events");
    }

    const pendingEventIds = rows.map(row => row.event_id);
    res.status(200).json(pendingEventIds); 
  });
});

app.get('/students', (req, res) => {
  const { promotion } = req.query; // Get the promotion from the query parameters

  if(promotion == null) {
    db.all("SELECT nom, prenom, etudiantid FROM etudiants", (err, rows) => {
      if (err) return res.status(500).send("Error fetching students");
      res.status(200).json(rows);
    });
  } else {
    getStudentsByPromotion(db, promotion).then(students => {
      res.status(200).json(students);
    });
  }
});

// Get events by promotion or student and date
app.get('/events', checkAdminAccess, async (req, res) => {
  const { promotion, etudiantid, nom, prenom, date } = req.query;

  try {
    let query = 'SELECT * FROM events WHERE date(start) = ?';
    let params = [date];

    if (promotion) {
      query += ' AND promotion = ?';
      params.push(promotion);
    } else if (etudiantid || (nom && prenom)) {
      query += ' AND id IN (SELECT event_id FROM event_students WHERE student_id = ?)';
      if (etudiantid) {
        params.push(etudiantid);
      } else {
        const student = await new Promise((resolve, reject) => {
          db.get('SELECT id FROM students WHERE nom = ? AND prenom = ?', [nom, prenom], (err, row) => {
            if (err) reject(err);
            resolve(row);
          });
        });
        if (student) {
          params.push(student.id);
        } else {
          return res.status(404).send('Student not found');
        }
      }
    }

    const events = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Error fetching events');
  }
});

// Add clockin for a user or promotion
/*
app.post('/add-clockin', checkAdminAccess, async (req, res) => {
  const { promotion, etudiantid, eventId, eventName } = req.body;

  try {
    if (etudiantid) {
      // get email from etudiantid
      const studentEmail = await new Promise((resolve, reject) => {
        db.get('SELECT email FROM users WHERE etudiantid = ?', [etudiantid], (err, row) => {
          if (err) reject(err);
          resolve(row ? row.email : null);
        });
      });

      if (!studentEmail) {
        studentEmail = ''
      }

      // fetch start of event
      const event = fetchEvent(promotion, eventId);
      const eventStartTime = new Date(event.start.dateTime).toISOString();

      // Add clockin for a specific student
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO clockins (user_id, email, event_id, event_name, timestamp) VALUES (?, ?, ?)', [etudiantid, studentEmail, eventId, eventName, eventStartTime], (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    } else if (promotion) {
      // Add clockin for all students in the promotion
      const students = await new Promise((resolve, reject) => {
        db.all('SELECT etudiantid FROM etudiants WHERE designationlong = ?', [promotion], (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });

      const promises = students.map(student => {
        return new Promise((resolve, reject) => {
          db.run('INSERT INTO clockins (user_id, event_id, timestamp) VALUES (?, ?, ?)', [student.etudiantid, eventId, new Date().toISOString()], (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      });

      await Promise.all(promises);
    }

    res.status(200).send('Clockin added successfully');
  } catch (error) {
    console.error('Error adding clockin:', error);
    res.status(500).send('Error adding clockin');
  }
});
*/

// Get absence count by promotion
app.get('/absence-count-by-promotion', checkAdminAccess, async (req, res) => {
  const { promotion } = req.query;

  // get N events for each group (no matter the student)
  const groups = ["Gr1", "Gr2", "Gr3", "Gr4"]
  let nEventsByGroup = {}

  let eventsByGroup = await fetchCalendarEventsWholeYear(promotion)
  for (let group of groups) {
    nEventsByGroup[group] = eventsByGroup[group].length
  }
  console.log("# nEventsByGroup : ", nEventsByGroup)

  // count absences for each student
  let result = [];
  const students = await getStudentsByPromotion(db, promotion);
  for(let student of students) {
    let absenceCount = 0

    // get the number of events for the student during the current school year
    const studentClockIns = await getClockInsByUserIdForCurrentScoolYear(db, student.etudiantid);
    let nStudClockins = 0
    if (studentClockIns != null && studentClockIns.length != null) {
      nStudClockins = studentClockIns.length
    }

    if( student.group_name == null) {
      absenceCount = nEventsByGroup["Gr1"] - nStudClockins; // default to Gr1 to get a count
    } else {
      absenceCount = nEventsByGroup[student.group_name] - nStudClockins;
    }
    result.push({
      studentId: student.etudiantid,
      name: student.nom,
      firstname: student.prenom,
      absenceCount: absenceCount,
    });
  }

  return res.status(200).json(result);
});

// Get absence details by student
app.get('/absence-details-by-student', checkAdminAccess, async (req, res) => {
  const { etudiantid } = req.query;

  try {
    let student;

    try {
        student = await getStudentById(db, etudiantid);
    } catch (error) {
        console.error('Error fetching student by ID:', error);
        return res.status(500).send('Error fetching student by ID');
    }

    console.log("student : ", student)

    let events = await fetchCalendarEventsWholeYearByGroup(student.designationlong, student.group_name || "Gr1", true);
    let studentClockIns = await getClockInsByUserIdForCurrentScoolYear(db, student.etudiantid);
    studentClockIns = studentClockIns.map(clockIn => clockIn.event_id);

    // test for student presence for each event
    let presenceSheet = []
    events.forEach((fetched_event) => {
      presenceSheet.push({
        'eventId': fetched_event.id,
        'eventTitle': fetched_event.summary,
        'start': `${formatDate(new Date(fetched_event.start.dateTime))} ${formatTime(new Date(fetched_event.start.dateTime))}`,
        'end': `${formatDate(new Date(fetched_event.end.dateTime))} ${formatTime(new Date(fetched_event.end.dateTime))}`,
        'was_present': studentClockIns.includes(fetched_event.id)
      });
    });

    res.status(200).json(presenceSheet);
  } catch (error) {
    console.error('Error fetching absence details by student:', error);
    res.status(500).send('Error fetching absence details by student');
  }
});

// Mark student as present (admin adds a clockin to a studient)
app.post('/mark-as-present', checkAdminAccess, async (req, res) => {
  const { etudiantid, eventId, eventTitle, promotion } = req.body;

  try {
    // Fetch the event details from Google Calendar
    const event = await fetchEvent(promotion, eventId);
    console.log("event: ", event)
    if (!event) {
      return res.status(404).send('Event not found');
    }
    const eventStartTime = new Date(event.start.dateTime).toISOString();

    // get email from etudiantid
    const studentEmail = await getEmailByEtuId(db, etudiantid);

    await new Promise((resolve, reject) => {
      db.run('INSERT INTO clockins (user_id, email, event_id, event_name, timestamp) VALUES (?, ?, ?, ?, ?)', [etudiantid, studentEmail, eventId, eventTitle, eventStartTime], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    res.status(200).send('Student marked as present');
  } catch (error) {
    console.error('Error marking student as present:', error);
    res.status(500).send('Error marking student as present');
  }
});

// Route to delete clockin
app.post('/delete-clockin', checkAdminAccess, async (req, res) => {
  const { etudiantid, eventId } = req.body;

  console.log(etudiantid + " " + eventId )

  try {

    // Assuming you have a function to delete clockin from the database
    await deleteClockin(etudiantid, eventId);
    res.status(200).json({ message: 'Clockin deleted successfully' });
  } catch (error) {
    console.error('Error deleting clockin:', error);
    res.status(500).json({ message: 'Error deleting clockin' });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://192.168.1.38:${port}/`);
});

