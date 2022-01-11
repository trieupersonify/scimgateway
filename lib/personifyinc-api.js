const axios = require('axios')
require('dotenv').config()
const crypto = require('crypto');

// today
const toDay = () => {
  let d = new Date(),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear()

  if (month.length < 2) 
      month = '0' + month
  if (day.length < 2) 
      day = '0' + day

  return [day, month, year].join('/')
}

// hash_hmac
const hash_hmac = (url, data, date) => {
  return crypto.createHmac('sha1', process.env.API_SECRET)
        .update(`${url}${data}${date}`)
        .digest('base64')
}

// USERS
// -- call api
const callApi = async (pluginName, baseEntity, action, scimgateway, url, method, data) => {
  try {
    scimgateway.logger.debug(`${pluginName}[${baseEntity}] handling "${action}" url=${url} data=${JSON.stringify(data)}`)
    
    // stringnify
    data = JSON.stringify(data)
    // get today
    const date = toDay();
    const headers = {
      method,
      'url': `${process.env.PERSONIFY_API}${url}`,
      'Content-Type': 'application/json',
      'Date': date,
      'Authorization': `PSY ${process.env.API_KEY}:${hash_hmac(url, data, date)}`
    };
    // call api
    const response = await axios({
      method,
      url: `${process.env.PERSONIFY_API}${url}`,
      data,
      headers
    })

    // get response data and status
    const resdata = await response.data
    const resstatus = await response.status

    // write log
    scimgateway.logger.debug(`${pluginName}[${baseEntity}] "callApi" ${method} code=${resstatus} response=${JSON.stringify(resdata)}`)
  } catch (e) {
    // write log
    scimgateway.logger.error(`${pluginName}[${baseEntity}] "callApi" ${method} exception=${e.message}`)
  }
}
// -- create users
const apiCreateUser = async (pluginName, baseEntity, scimgateway, data) => {
  data = {
    first_name: data.name && data.name.givenName ? data.name.givenName : "(Not set)",
    last_name: data.name && data.name.familyName ? data.name.familyName : "(Not set)",
    email: data.userName,
    password: Math.random().toString(36).slice(-10)
  }
  await callApi(pluginName, baseEntity, "apiCreateUser", scimgateway, "/user", "POST", data)
}
// -- update users
const apiUpdateUser = async (pluginName, baseEntity, scimgateway, data, id) => {
  data = {
    first_name: data.name && data.name.givenName ? data.name.givenName : "(Not set)",
    last_name: data.name && data.name.familyName ? data.name.familyName : "(Not set)"
  }
  await callApi(pluginName, baseEntity, "apiUpdateUser", scimgateway, `/user/${id}`, "PUT", data)
}
// -- delete users
const apiDeleteUser = async (pluginName, baseEntity, scimgateway, data, id) => {
  await callApi(pluginName, baseEntity, "apiDeleteUser", scimgateway, `/user/${id}`, "DELETE", data)
}

// GROUPS (skip)

// export
module.exports = {
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  hash_hmac
}