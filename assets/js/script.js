

function goToFeature()
{
	document.getElementById("featured").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}

function goToContact()
{
	document.getElementById("contact").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}

function goToHome()
{
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


const productsButton = document.getElementById("productsButton");
const productsDropdown = document.getElementById("productsDropdown");

productsButton.addEventListener("click", function(event)
{
    event.stopPropagation();

    productsDropdown.classList.toggle("open");
});


productsDropdown.addEventListener("click", function(event)
{
    if (event.target.closest(".highlight_text"))
    {
        productsDropdown.classList.remove("open");
    }
});


document.addEventListener("click", function(event)
{
    if (!event.target.closest(".products_menu"))
    {
        productsDropdown.classList.remove("open");
    }
});