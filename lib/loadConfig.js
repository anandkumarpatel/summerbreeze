'use strict';
var dotenv = require('dotenv');
var eson = require('eson');
var path = require('path');
var env = process.env.NODE_ENV;
var ROOT_DIR = path.resolve(__dirname, '..');

dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(__dirname, '../configs/default'));
dotenv._getKeysAndValuesFromEnvFilePath(path.resolve(__dirname, '../configs/'+env));
dotenv._setEnvs();
dotenv.load();

process.env = eson()
  .use(convertStringToNumeral)
  .parse(JSON.stringify(process.env));
process.env.ROOT_DIR = ROOT_DIR;

function convertStringToNumeral(key, val) {
  if (!isNaN(val)) {
    return parseInt(val);
  } else {
    return val;
  }
}
