// Select all buttons with the class 'btnA'
const buttons = document.querySelectorAll('.btnA');

// Add a click event listener to each button
buttons.forEach(function(button) {
    button.addEventListener('click', function() {
        // Remove all elements with the class 'modal-backdrop'
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(function(backdrop) {
            backdrop.remove();
        });
    });
});