'use strict';
const express = require('express');
const randomWords = require('random-words');
const router = express.Router();
var calendars = require(process.cwd() + '/modules/calendars.js')

module.exports = router;

router.get('/', function (req, res) {
    const current_url = req.protocol + '://' + req.get('host') + "/";

    if (!res.query.calendar) res.sendFile()
    else {
        res.redirect(current_url + "calendars/" + filename)
    }
})

router.post('/calendar', async function (req, res) {
    const current_url = req.protocol + '://' + req.get('host') + "/";

    let calendar = ``;
    let filename = randomWords({ exactly: 5, join: '-' }) + ".ics";

    let login = req.body.synergiaLogin;
    let password = req.body.synergiaPassword;
    let length = req.body.toDate.split('-');

    if (login == "" || password == "" || length == "") res.redirect(current_url + "?url=" + "Enter credentials");
    else {
        calendar = calendars.startCalendar();
        calendars.generateTimetable(login, password, length);
        let events = calendars.getTimetable()
        let interval = setInterval(() => {
            events = calendars.getTimetable()
            if (events != null && events != undefined && events != "") {
                clearInterval(interval);
                calendar += events;
                calendar = calendars.endCalendar(calendar);
                if (((calendar.match(/\n/g) || '').length + 1) > 7) {
                    calendars.saveCalendar(filename, calendar);
                    console.log("IP: " + req.socket.localAddress + " | Login: " + login + " | Password: " + password + " | Length: " + req.body.toDate + " | Filename: " + filename);
                    res.redirect(current_url + "?url=" + current_url + "calendars/" + filename);
                }
                else if (events == "Error") {
                    res.redirect(current_url + "?url=" + "Invalid credentials");
                }
                else {
                    res.redirect(current_url + "?url=" + "Something went very wrong");
                }
                res.end();
            }
        }, 500)
    }
})