require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

// allow CORS (Corss-Origin-Resource-Sharing)
app.use(cors())

// register assets folder
app.use(express.static('dist/phonebook'))

// register json parser
app.use(express.json())

// register request logger
morgan.token('req-body', function getRequestBody (req) {
  return (req.method === 'POST' || req.method === 'PUT')
    ? JSON.stringify(req.body)
    : ' '
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body'))

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(persons => {
      console.log('found', persons.length, 'persons')
      response.json(persons)
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        console.log('found', person)
        response.json(person)
      } else {
        console.log('not found')
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  // make sure name and number is not empty
  const reqData = request.body
  if (!reqData.name || !reqData.number) {
    const message = { error: 'no name and/or phone number provided' }
    console.log('validation failed', message)
    response.status(400).send(message)
    return
  }

  const person = {
    name: reqData.name.trim(),
    number: reqData.number.trim(),
  }

  // make sure name is unique
  Person.find({ name: person.name })
    .then(result => {
      console.log(result)
      if (result && result.length === 1) {
        console.log('name exists already. phone number will be updated on the existing record')
        // update person in the backend
        Person.findByIdAndUpdate(result[0].id, person, { new: true, runValidators: true, context: 'query' })
          .then(updatedPerson => {
            console.log('person updated in database')
            response.json(updatedPerson)
          })
          .catch(error => next(error))
      } else {
        // add new person to database
        new Person(person).save()
          .then(savedPerson => {
            console.log('person saved to database')
            response.json(savedPerson)
          })
          .catch(error => next(error))
      }
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  // gather request data
  const personId = request.params.id
  const reqData = request.body
  const person = {
    name: reqData.name.trim(),
    number: reqData.number.trim(),
  }

  // update person in the backend
  Person.findByIdAndUpdate(personId, person, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      console.log('person updated in database')
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

// handler of requests with unknown endpoint
app.use((request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
})

// handler of requests with result to errors
// this has to be the last loaded middleware.
app.use((error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({
      error: 'malformatted id'
    })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({
      error: error.message })
  }
  next(error)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
