function startCountdown() {
  const countElement = document.getElementById("count");


  setInterval(function () {
  
    const now = new Date();

  
    let targetTime = new Date();

   
    const day = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    
    if (day === 5) {
     
      targetTime.setHours(13, 40, 0, 0);
    } else if (day === 6 || day === 0) {
      
      countElement.innerHTML = "Weekend";
      return;
    } else {
      // All other weekdays: Target time is 16:00
      targetTime.setHours(16, 0, 0, 0);
    }

    
    if (now >= targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);

      
      if (day === 5) {
        countElement.innerHTML = "Weekend";
        return;
      }
    }

    // Calculate the difference in milliseconds
    const timeDifference = targetTime - now;

    // Convert milliseconds to hours, minutes, and seconds
    const hours = String(
      Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    ).padStart(2, "0");
    const minutes = String(
      Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60))
    ).padStart(2, "0");
    const seconds = String(
      Math.floor((timeDifference % (1000 * 60)) / 1000)
    ).padStart(2, "0");

    // Display the result in the element with id="count"
    countElement.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
  }, 1000); // Refresh every 1 second
}

// Start the countdown when the page loads
startCountdown();