'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodoverride = require('method-override');
const PORT = process.env.PORT || 5555;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

client.on('err', errorHandller);

app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodoverride('_method'));
app.set('view engine', 'ejs');

app.get('/', homePage);
function homePage(req, res) {
    let url = 'https://digimon-api.herokuapp.com/api/digimon';
    superagent.get(url)
        .then((urlRes) => {
            let dataRes = urlRes.body.map(data => {
                return new Digimon(data);
            })
            res.render('index', { data: dataRes });
        }).catch(err => errorHandller(err, req, res));
}

function Digimon(data) {
    this.name = data.name || 'no name';
    this.img = data.img || 'no img';
    this.level = data.level || 'no level';
}

app.get('/favorite/:id', favoritePage);
function favoritePage(req, res) {
    let mId = req.params.id;
    let sql = 'SELECT * FROM atable WHERE id=$1;';
    let safeValue = [mId];
    client.query(sql, safeValue)
        .then((resultRes) => {
            res.render('favorite', { val: resultRes.rows });
        }).catch(err => errorHandller(err, req, res));
}

app.get('/favorite', allFavoritePage);
function allFavoritePage(req, res) {
    console.log('hello');
    let sql = 'SELECT * FROM atable;';
    console.log('hello1');
    client.query(sql)
        .then((resultRes) => {
            console.log('hello2');
            res.render('favorite', { val: resultRes.rows });
        }).catch(err => errorHandller(err, req, res));
}

app.get('/add', addPage);
function addPage(req, res) {
    let { name, img, level } = req.body;
    let sql = 'INSERT INTO atable (name,img,level) VALUES ($1,$2,$3);';
    let safeValues = [req.body.name, req.body.img, req.body.level];
    client.query(sql, safeValues)
        .then(() => {
            console.log('here');
            res.redierct('/favorite')
        }).catch(err => errorHandller(err, req, res));

}

app.put('/update/:id', updateHandler);
function updateHandler(req, res) {
    let mId = req.params.id;
    let sql = 'UPDATE atable SET name=$1,img=$2,level=$3 WHERE id=$4;';
    let safeValues = [name, img, level, mId];
    client.query(sql, safeValues)
        .then(() => {
            res.redierct('favorite');
        }).catch(err => errorHandller(err, req, res));
}
app.use('*', notFoundHandler);

client.connect()
    .then(() => {
        app.listen(PORT, console.log(`RUN on ${PORT}`));
    })


function errorHandller(err, req, res) {
    res.status(500).send(err);
}
function notFoundHandler(req, res) {
    res.status(404).send('PAGE NOT FOUND');
}