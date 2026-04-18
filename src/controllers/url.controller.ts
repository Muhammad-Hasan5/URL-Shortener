process.loadEnvFile()

import type { Request, Response } from "express";
import { generateShortCode } from "../services/url.service.js";
import { saveToDB, getFromDB } from "../repositories/url.repository.js";
import { query } from "../db/index.js";


// covnert long url to SHORT one
export const shortURL = async (req: Request, res: Response) => {
  const {longURL}  = req.body;

  //validate long url
  try {
    new URL(longURL)
  } catch {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: "invalid url",
    });
  }


  // save into db
  let attempts = 0;

  while(attempts < 3){
    try {
      // call service to short url
      const result = generateShortCode();


      // checking if already exists or not
      const existing = await query(`SELECT short_code FROM urls WHERE long_url = $1`, [longURL])
      if(existing?.rows.length as number > 0){
         return res.status(200).json({
           success: true,
           shortURL: `${process.env.BASE_URL}/${existing?.rows[0].short_code}`,
         });
      }


      //inserting into DB
      await saveToDB({
        id: result.id,
        shortCode: result.shortCode,
        longURL,
      });


      //response
      const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT}`

      return res.status(201).json({
        status: 201,
        success: true,
        msg: "long url is shortened and saved in DB",
        shortURL: `${baseURL}/${result.shortCode}`
      });

    } catch (error: any){
      if(error.code === "23505"){
        attempts++;
        continue
      }

      console.log("Error occuring while saving to DB", error);
    }
  }
};


// REDIRECT to long url
export const redirect = async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  if (!shortCode) {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: "short code is not available",
    });
  }


  // call db to get redirect long url
  const result = await getFromDB(shortCode as string);
    if (result?.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        msg: "url not exist on DB",
      });
    }

  // redirect
  return res.redirect(302, result!.rows[0].long_url);
};
