const { createCanvas } = require('canvas');



const wrapText = function(ctx, text, x, y, maxWidth, lineHeight) {
    // First, start by splitting all of our text into words, but splitting it into an array split by spaces
    let words = text.split(' ');
    let line = ''; // This will store the text of the current line
    let testLine = ''; // This will store the text when we add a word, to test if it's too long
    let lineArray = []; // This is an array of lines, which the function will return

    // Lets iterate over each word
    for(var n = 0; n < words.length; n++) {
        // Create a test line, and measure it..
        testLine += `${words[n]} `;
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        // If the width of this test line is more than the max width
        if (testWidth > maxWidth && n > 0) {
            // Then the line is finished, push the current line into "lineArray"
            lineArray.push([line, x, y]);
            // Increase the line height, so a new line is started
            y += lineHeight;
            // Update line and test line to use this word as the first word on the next line
            line = `${words[n]} `;
            testLine = `${words[n]} `;
        }
        else {
            // If the test line is still less than the max width, then add the word to the current line
            line += `${words[n]} `;
        }
        // If we never reach the full max width, then there is only one line.. so push it into the lineArray so we return something
        if(n === words.length - 1) {
            lineArray.push([line, x, y]);
        }
    }
    // Return the line array
    return lineArray;
};

return;

const canvas = createCanvas(200, 200)
const ctx = canvas.getContext('2d')

let grd = ctx.createLinearGradient(0, 100, 110, 0);
grd.addColorStop(0, '#00a0ff');
grd.addColorStop(1, '#12cba6');
ctx.fillStyle = grd;
ctx.fillRect(0, 0, 1342, 853);

ctx.font = '400 20px Helvetica';
ctx.fillStyle = 'white';
const wrappedText = image.wrapText(ctx, 'This is a very long and long text to test if the line jumps!', 20, 20, 180, 22);

wrappedText.forEach(function(item) {
    ctx.fillText(item[0], item[1], item[2]);
})

console.log(canvas.toDataURL());