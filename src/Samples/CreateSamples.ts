import fs = require('fs');
import path = require('path');

import { Chinook } from './Chinook';
import { Northwind } from './Northwind';
import { SimpleMovie } from './SimpleMovie';

const directory = path.join(__dirname, '..', '..', 'data', 'formatted', "sqlite");

if(!fs.existsSync(path.join(directory, "simple-movie.gdb"))) {
  SimpleMovie.create();
}

if(!fs.existsSync(path.join(directory, "northwind_small.gdb"))) {
  Northwind.create();
}

if(!fs.existsSync(path.join(directory, "chinook.gdb"))) {
  Chinook.create();
}