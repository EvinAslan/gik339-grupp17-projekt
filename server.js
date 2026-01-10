const express = require("express"); //importerar Express ramverket för att bygga servern.

const sqlite3 = require("sqlite3").verbose();//importerar sqlite3 paketet för att kunna prarta med darabasen och verbose() ger oss mer detaljerande felmedelanden.

const app = express();//skapar en instans av en Express applikation och "app" är nu vår server.

const port = 3000; //detta väljer vilken port servern ska lyssna på och 3000 är en vanlig port för utveckling.
