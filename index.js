// Adding .env variables
// require('dotenv').config()

const MONGO_URI = 'mongodb+srv://Schlemuel:Doquinha.0428@cluster0.gucv5ni.mongodb.net/?retryWrites=true&w=majority'

// Making many consts
const express = require('express')
const mongoose  = require('mongoose')
const dns = require('dns')
const url = require('url')
const app = express()
const PORT = process.env.PORT || 3000
// const URI = process.env.MONGO_URI
const URI = MONGO_URI;
const { Schema } = mongoose

//Working with the mongoose
mongoose.connect(URI, {useNewUrlParser: true, useUnifiedTopology: true})

const urlSchema = new Schema({
    url: String,
    id: Number
})

const urlModel = mongoose.model('URL', urlSchema)

const saveUrl = (url, id) =>{
    let msg = new urlModel({
        url: url,
        id: id
    })

    msg.save()
}

async function find(url){
    let reading = []

    await urlModel.find({
        url: url
    })
    .then(doc => {
        reading = doc
    })
    .catch(err => {
        console.error(err)
    })

    if(reading.length === 0){
        return ''
    } else {
        return reading[0].id
    }
}

async function findId(id){
    let object

    await urlModel.find({
        id: id
    })
    .then(doc => {
        object = doc
    })
    .catch(err => {
        console.error(err)
    })

    return object[0].url
}

async function checkUrl(testeUrl){
    let host

    if(testeUrl.split('').slice(0, 8).join('') != 'https://'){
        return 'invalid url'
    } else {
        let q = url.parse(testeUrl, true)
        host = q.host
    }

    const resul =  new Promise((resolve) => {
        dns.lookup(host, (error, ip, family) => {
            if(error){
                resolve('invalid hostname')
            } else {
                resolve(true)
            }
        })
      })

    return resul
}

//Receiving the HTTP request

app.use(express.static(__dirname + '/public'))

app.use(express.urlencoded({
    extended: true
}))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Home.html')
})

app.post('/api/shorturl', async (req, res) => {
    let url = req.body.url
    if(url.split('').slice(-1) == '/'){
        url = url.split('').slice(0, -1).join('')
    }
    const returned = await find(url)
    let short_url

    if(returned === ''){
        const lastUrl = await urlModel.findOne().sort({id: -1})
        short_url = lastUrl.id + 1
        const exist = await checkUrl(url)

        if(exist == 'invalid url'){
            return res.json({error: "Invalid URL"})
        } else if(exist == 'invalid hostname'){
            return res.json({error: "Invalid Hostname"})
        }

        saveUrl(url, short_url)
    } else {
        short_url = returned
    }

    res.json({"original_url": url, "short_url": short_url})
})

app.get('/api/shorturl/:id', async (req, res) => {
    let id = req.params.id
    const url = await findId(id)
    res.redirect(url)
})

app.listen(PORT)