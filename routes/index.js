'use strict';
const express = require('express');
const router = express.Router();
const Librus = require('librus-api');
const fs = require('fs');
const ics = require('ics');

let client = new Librus();
let filename = "";
let file = false;

module.exports = router;

router.get('/', function (req, res) {
    res.sendFile()
})

router.get('/calendar', function (req, res) {
    const current_url = req.protocol + '://' + req.get('host') + "/";

    let login = req.query.login;
    let password = req.query.password;
    filename = req.query.filename;

    if (login == "" || password == "" || filename == "") res.end()

    filename += ".ics";

    client.authorize(login, password).then(function () {
        client.calendar.getTimetable().then(data => { splitDays(JSON.parse(JSON.stringify(data)), filename) });
    })

    let interval = setInterval(() => { if (file) res.send(current_url + "calendars/" + filename); clearInterval(interval) }, 1000)
});



function splitDays(data, filename, ammount = 1) {
    let day = 0;
    var callendar =
`
BEGIN: VCALENDAR
VERSION: 2.0
CALSCALE: GREGORIAN
PRODID: adamgibbons / ics
METHOD: PUBLISH
X - PUBLISHED - TTL: PT1H
`;

    function getPreviousMonday() {
        var date = new Date();
        var day = date.getDay();
        var prevMonday = new Date();
        if (date.getDay() == 0) {
            return date;
        }
        else {
            prevMonday.setDate(date.getDate() - (day - 1));
        }

        return prevMonday;
    }

    function saveCalendar(data, filename) {
        fs.writeFile("./public/calendars/" + filename, data + "END:VCALENDAR", function (err) {
            if (err) throw err;
            file = true;
        });
    }

    function addEvent(time, day, month, title, teacher) {
        time = time.split('-')[0].replace(" ", "").split(":")
        let event = {
            start: [getPreviousMonday().getUTCFullYear(), Number(month), Number(day), Number(time[0]), Number(time[1])],
            duration: { minutes: 45 },
            title: title,
            categories: ['lesson'],
            organizer: { name: teacher },
        }

        return ics.createEvent(event, (error, value) => {
            if (error) {
                console.log(error)
                return
            }
            return value.split("\n").slice(6).join("\n").replace(/\r?\n?[^\r\n]*$/, "").replace(/\r?\n?[^\r\n]*$/, "");
        })
    }

    Object.keys(data.table).forEach(function (key) {
        for (let i = 0; i < data.hours.length; i++) {
            if (data.table[key][i]) {
                let _temp = data.table[key][i].title.split('-');
                callendar += addEvent(data.hours[i], day, _temp[0].replace("\n", ""), _temp[1].replace("\n", ""));
            }
            else {
                continue;
            }
            callendar += "\n";
        }
        day++;
    })

    saveCalendar(callendar, filename);
}