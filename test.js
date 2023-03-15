console.log("Please wait 20 seconds!");
setInterval(()=>console.log("Hello from child!"), 2500);
setTimeout(()=> { console.log("DONE!"); process.exit() }, 20000);