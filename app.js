const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

//API 1
const convertToApi1 = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`
  const states = await db.all(getStatesQuery)
  response.send(states.map(eachState => convertToApi1(eachState)))
})

//API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT * FROM state WHERE state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  response.send(convertToApi1(state))
})

//API 3
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const createDistrict = `
  INSERT INTO district (district_name, state_id, cases, cured, active, deaths) VALUES 
  ('${districtName}, ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`
  const district = await db.run(createDistrict)
  response.send('District Successfully Added')
})

//API 4
const convertToAPi4 = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
  SELECT * FROM district WHERE district_id = ${districtId};`
  const singleDistrict = await db.get(getDistrict)
  response.send(convertToApi4(singleDistrict))
})

//API 5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE FROM district WHERE district_id = ${districtId};`
  const deleteDistrict = await db.run(deleteQuery)
  response.send('District Removed')
})

//API 6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateQuery = `
  UPDATE district SET district_name = '${districtName}',state_id = ${stateId},cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths} WHERE district_id = ${districtId};`
  const updateDistrict = await db.run(updateQuery)
  response.send('District Details Updated')
})

//API 7
app.get('states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths FROM district WHERE 
  state_id = ${stateId};`
  const getStateById = await db.get(getStateQuery)
  response.send(getStateById)
})

//API 8

module.exports = app
