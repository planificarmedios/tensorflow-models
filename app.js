   const URL = "./my_model/";
   let model, model2, webcam, webcam2, labelContainer, maxPredictions, maxPredictions2, usbCamera;
   let usbCameraId, integratedCameraId;
   let frameCounter =0
   let frameCounter2 = 0
   const predictionThreshold = 3; // Adjust this threshold as needed

   document.addEventListener("DOMContentLoaded", function() {
    // Your code here will execute when the DOM content is fully loaded
    init(); // Assuming init() is the function you want to execute
});

   async function setupUSBStream() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        

        devices.forEach((device) => {
            if (device.kind === "videoinput") {
                if (device.label.includes("GENERAL WEBCAM")) {
                  usbCameraId = device.deviceId;
                  console.log ('usbCameraId', usbCameraId)
          
                } else {
                  integratedCameraId = device.deviceId;
                  console.log ('integratedCameraId', integratedCameraId)
                }
            }

        });

        if (usbCameraId) {
            const constraints = {
                video: {
                    deviceId: usbCameraId
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoElement = document.getElementById('webcam-container1');
            videoElement.srcObject = stream;
        } else {
            console.error('No USB camera found.');
        }

        if (integratedCameraId) {
            const constraints = {
                video: {
                    deviceId: integratedCameraId
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoElement = document.getElementById('webcam-container2');
            videoElement.srcObject = stream;
        } else {
            console.error('No integrated camera found.');
        }

    } catch (error) {
        console.error('Error camera:', error);
    }
   }

     async function init() {
       const modelURL = URL + "model.json";
       const metadataURL = URL + "metadata.json";
       model = await tmImage.load(modelURL, metadataURL);
       maxPredictions = model.getTotalClasses();
       
       setupUSBStream();
       
       const flip1 = true; 
       webcam = new tmImage.Webcam(200, 200, flip1); 
       await webcam.setup(); 
       await webcam.play();
       window.requestAnimationFrame(loop);

       // Load model for USB camera
        const modelURL2 = URL + "model2.json";
        const metadataURL2 = URL + "metadata2.json";
        model2 = await tmImage.load(modelURL2, metadataURL2);
        maxPredictions2 = model2.getTotalClasses();

        // Setup USB camera
        const constraints = {
            video: {
                deviceId: usbCameraId ? { exact: usbCameraId } : undefined // Use the USB camera if available
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam2 = new tmImage.Webcam(200, 200, false, stream); // width, height, flip, stream
        await webcam2.setup(); // request access to the webcam
        await webcam2.play();
        window.requestAnimationFrame(loop2);

       // append elements to the DOM
       document.getElementById("webcam-container1").appendChild(webcam.canvas);
       document.getElementById("webcam-container2").appendChild(webcam2.canvas);
       labelContainer = document.getElementById("label-container");
    }

     async function loop() {
       webcam.update(); 
        // Increment the frame counter
       frameCounter++;
       
       // Check if the counter reaches the prediction threshold
       if (frameCounter >= predictionThreshold) {
           await predict(); // Perform prediction
           frameCounter = 0; // Reset the counter after prediction
       }
       setTimeout(loop, 1000);
     }

     async function loop2() {
      webcam2.update(); 
       // Increment the frame counter
      frameCounter2++;

      // Check if the counter reaches the prediction threshold
      if (frameCounter2 >= predictionThreshold) {
          await predict2(); // Perform prediction
          frameCounter2 = 0; // Reset the counter after prediction
      }
      setTimeout(loop2, 1000);
    }


     async function predict() {
     
       const prediction = await model.predict(webcam.canvas);
       const progressBar = document.getElementById('divClassDanger');
       const progressBarSucc = document.getElementById('divClassSuccess');
       const progressBarInfo = document.getElementById('divClassInfo');

       prediction.map((data) => {
        
         if (data.className === 'desconocidos') {
           let a = data.probability * 100
           progressBar.style.width = `${a}%`;
         } else if (data.className === 'papito')  {
           let b = data.probability * 100
           progressBarSucc.style.width = `${b}%`;
         } else {
           let c = data.probability * 100
           progressBarInfo.style.width = `${c}%`;
         }
       });

       for (let i = 0; i < maxPredictions; i++) {
         const classPrediction =
           prediction[i].className +
           ": " +
           prediction[i].probability.toFixed(2);
         //labelContainer.childNodes[i].innerHTML = classPrediction;
       }
     }

     async function predict2() {
          
      const prediction2 = await model.predict(webcam2.canvas);
      const progressBar = document.getElementById('divClassDangerUSB');
      const progressBarSucc = document.getElementById('divClassSuccessUSB');
      const progressBarInfo = document.getElementById('divClassInfoUSB');

      prediction2.map((data) => {
  
        if (data.className === 'desconocidos') {
          let a = data.probability * 100
          document.body.style.backgroundColor = "red";
          progressBar.style.width = `${a}%`;
        } else if (data.className === 'papito')  {
          let b = data.probability * 100
          document.body.style.backgroundColor = "white";
          progressBarSucc.style.width = `${b}%`;
        } else {
          let c = data.probability * 100
          progressBarInfo.style.width = `${c}%`;
        }
      });

      for (let i = 0; i < maxPredictions2; i++) {
        const classPrediction =
          prediction2[i].className +
          ": " +
          prediction2[i].probability.toFixed(2);
        //labelContainer.childNodes[i].innerHTML = classPrediction;
      }
    }
 