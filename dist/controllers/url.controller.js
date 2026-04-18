import { generateShortCode } from "../services/url.service.js";
import { saveToDB, getFromDB } from "../repositories/url.repository.js";
// covnert long url to short one
export const shortURL = async (req, res) => {
    const { longURL } = req.body;
    try {
        new URL(longURL);
    }
    catch {
        return res.status(400).json({
            status: 400,
            success: false,
            msg: "invalid url",
        });
    }
    // call service to short url
    const result = generateShortCode();
    //TODO: check if it is already exists or not to avoid duplicates
    // save into db
    let attempts = 0;
    let DBres;
    while (attempts < 3) {
        try {
            DBres = await saveToDB({ id: result.id, shortCode: result.shortCode, longURL });
        }
        catch {
            attempts++;
        }
    }
    if (!DBres) {
        return res.status(500).json({
            success: false,
            msg: "failed to save URL",
        });
    }
    //response
    return res.status(201).json({
        status: 201,
        success: true,
        msg: "long url is shortened and saved in DB",
        shortURL: `${process.env.BASE_URL}/${result.shortCode}` ||
            `http://localhost:${process.env.PORT}/${result.shortCode}`,
    });
};
// redirect to long url
export const redirect = async (req, res) => {
    const { shortCode } = req.params;
    if (!shortCode) {
        return res.status(400).json({
            status: 400,
            success: false,
            msg: "short code is not available",
        });
    }
    // call db to get redirect long url
    const result = await getFromDB(shortCode);
    if (!result) {
        return res.status(404).json({
            status: 404,
            success: false,
            msg: "url not exist on DB",
        });
    }
    // redirect
    return res.status(302).redirect(302, result.rows[0].long_url);
};
//# sourceMappingURL=url.controller.js.map