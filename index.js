// const bsCustomFileInput = require('bs-custom-file-input');
var imageServiceBaseUrl = "https://warm-reaches-88469.herokuapp.com/api/getImageStandard/";
$(document).ready(function () {

    loadBaseImages();
    var $imageUploadTemplate = $(".image-data.template .preview .group");

    // Event handlers
    $(".container").on('click', 'img', function () {
        window.open(this.src, "_blank");
    });

    $(".container").on("change", ".image-data .image-btn", function (e) {
        if (e.target.files.length > 5) {
            alert("You are only allowed to upload a maximum of 5 files");
            return false;
        }

        var $preview = $(this).parents(".image-data").find(".preview");
        $(this).parents(".image-data").find(".uploader").hide();
        $preview.show().children(".row").empty();

        for (var i = 0; i < e.target.files.length; i++) {
            setupFileReader(e.target.files[i], $imageUploadTemplate, $preview, validator);
        }
    });

    $(".container").on("click", ".image-data .clear", function () {
        $(this).parents(".image-data").find(".uploader").show();
        $(this).parents(".image-data").find(".preview").hide().children(".row").empty();
    });
});

function validator() {
    var arMatch = $(this).parents(".image-data").find(".detail .aspect-ratio>span").text() === $(this).parent().find(".aspect-ratio>span").text();
    var srcWidth = parseInt($(this).parents(".image-data").find(".detail .dimension>span").text().split("x")[0], 10);
    var trgtWidth = parseInt($(this).parent().find(".dimension>span").text().split("x")[0], 10);

    //>> Add badge
    $(this).parent().find(".aspect-ratio").append("&nbsp;<span class=\"badge badge-" + (arMatch ? "success" : "danger") + "\">" + (arMatch ? "Match" : "Mismatch") + "</span>");
    if (arMatch) {
        $(this).parent().find(".dimension").append("&nbsp;<span class=\"badge badge-" + (trgtWidth >= srcWidth ? "success" : "warning") + "\" " + (trgtWidth < srcWidth ? "title=\"Image may get stretched\"" : "") + ">" + (trgtWidth >= srcWidth ? "Perfect" : "Smaller image") + "</span>");
    }
}

function setupFileReader(imgFile, $imageUploadTemplate, $preview, validationCallback) {
    var $element = $imageUploadTemplate.clone();
    var $img = $element.children("img")[0];
    $img.onload = function (e) {
        getImageDetails.call(this, validationCallback);
    };
    $preview.children(".row").append($element);
    var reader = new FileReader();
    reader.onload = function (e) {
        // console.log(e.target);
        $($img).attr('src', e.target.result);
        $element.find(".size>span").text(Math.round(imgFile.size / 1024));
    };
    reader.readAsDataURL(imgFile);
}

function loadBaseImages() {
    var _site = "svg";
    if (location.search) {
        location.search.replace("?", "").split("&").filter(function (t) {
            if (t && t.split("=")[0] === "site") {
                _site = t.split("=")[1];
            }
        });
    }

    fetch(imageServiceBaseUrl + _site).then(function (res) {
        if (res.ok) { // if HTTP-status is 200-299
            res.json().then(function (d) {
                if (!d) {
                    return false;
                }
                var $template = $(".template"),
                    $container = $(".container");
                d.forEach(function (element) {
                    var $entry = $template.clone().removeClass("template");
                    $entry.find(".detail img")[0].onload = getImageDetails;
                    $entry.find(".detail img").attr("src", element.url);
                    $entry.find(".detail .image-name").text(element.name);
                    $container.append($entry);

                    var xhr = new XMLHttpRequest();
                    xhr.open('HEAD', element.url, true);
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            if (xhr.status == 200) {
                                $entry.find(".size>span").text(Math.round(xhr.getResponseHeader('Content-Length') / 1024));
                            }
                        }
                    };
                    xhr.send(null);
                });
            }).catch(function () {
                console.log("No record found");
            });
        }
    });
}

function getImageDetails(validationCallback) {
    var $parent = $(this).parent();
    var r = gcd(this.naturalWidth, this.naturalHeight);
    $parent.find(".dimension>span").text(this.naturalWidth + 'x' + this.naturalHeight);
    $parent.find(".aspect-ratio>span").text(this.naturalWidth / r + ':' + this.naturalHeight / r);

    if (typeof validationCallback === "function" && validationCallback) {
        validationCallback.call(this);
    }
}

/** Greatest Common Diviser */
function gcd(w, h) {
    return (h == 0) ? w : gcd(h, w % h);
}