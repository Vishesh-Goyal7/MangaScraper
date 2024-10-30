import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

let chapter = 1
let pageNo = 1

const getManga = async(url, dst) => {
    try{
        const browser = await puppeteer.launch({
            headless:true,
        })

        const page = await browser.newPage()
        
        await page.goto(url, {waitUntil: 'networkidle2', timeout:50000})
        
        const [allImgUrls, nextPageUrl, noImage] = await page.evaluate(async() => {
            const divImg = document.querySelector('div.inside-article')
            const image = divImg.querySelectorAll('img.img-loading')
            let link = null
            const divBtn = document.querySelector('div.gb-button-wrapper.gb-button-wrapper-fe863527')
            if(divBtn){
                link = divBtn.querySelector('a.gb-button.gb-button-122d9fa4')
            }
            const abc = Array.from(image).map((img) => img.src)

            return [abc, divBtn ? link.href : null, abc.length === 0]
        })

        if(noImage){
            const updates = {
                "no Images" : chapter
            }
            fs.writeFile("/Users/visheshgoyal/JS Projects/mangascraper code/Output/missed.json", JSON.stringify(updates), (err) => {
                if (err) {
                    console.error(`Error writing file: ${err.message}`);
                } else {
                    console.log(`Data successfully written`);
                }
            });
        }

        console.log(allImgUrls.length);

        let dstChapter = path.join(dst, `chapter${chapter}`)
        
        fs.mkdir(dstChapter, (err) => {
            if (err) {
                console.log(err.message, " ----- ")
            } else {
                console.log("directory made")
            }
        })

        for (const imageUrl of allImgUrls) {
            await downloadImage(imageUrl, dstChapter)
        }

        console.log("downloaded chapter, moving to next");
        
        chapter++

        console.log(nextPageUrl);

        if(nextPageUrl){
            await browser.close()
            pageNo = 1
            await getManga(nextPageUrl, dst)
        } else {
            await browser.close()
            console.log("Download Complete for all chapters");
        }
    } catch(err){
        console.log("here");
        console.log(err.message);
        process.exit(1)
    }
}

async function downloadImage(imageSrc, filePath) {
    try{
        const response = await fetch(imageSrc)
        
        if (!response.ok) {
            throw new Error(`HTTPS error! Status: ${response.status}`);
        }
        const buffer = await response.buffer();
        filePath = path.join(filePath, `${pageNo}.jpg`)
        fs.writeFileSync(filePath, buffer);
        console.log(pageNo);
        pageNo++
    } catch(error){
        console.error('Error downloading the image:', error);
    }
}

getManga('https://hellsparadise.net/manga/hells-paradise-chapter-1/', '/Users/visheshgoyal/JS Projects/mangascraper code/Output')