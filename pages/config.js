var imageServiceBaseUrl = "https://warm-reaches-88469.herokuapp.com/api/";
// var imageServiceBaseUrl = "http://localhost:3000/api/";
var allBrandsConfig = [], currentBrand = {}, $imageUploadTemplate = null;

$(document).ready(function () {
    getBrands();
    $imageUploadTemplate = $(".image-data .template");

    // Event handlers
    $(".container").on('click', 'img', function () {
        window.open(this.src, "_blank");
    });

    $(".container").on("change", ".site-name", function () {
        if ($(this).val()) {
            $(".config-section").show();
            loadBrandConfig($(this).val());
        } else {
            $(".config-section").hide();
        }
    });

    $(".container").on("click", ".detail .btn-delete", function () {
        if(confirm("Are you sure?")){
            var $parent = $(this).parents(".detail");
            currentBrand.standards = currentBrand.standards.filter(function (t) {
                return t.name !== $parent.find(".image-name").text();
            });
    
            $.ajax({
                type: "POST",
                url: imageServiceBaseUrl + "updateImageStandard",
                data: JSON.stringify(currentBrand),
                contentType: "application/json",
                success: function (responseText, statusText, xhr, $form) {
                    console.log(responseText);
                    $parent.parent().remove();
                },
                error: function (xhr, status, error) {
                    console.log(error);
                }
            });
        }
    });

    $(".image-btn").on("change", function (e) {
        var _file = e.target.files[0];
        if (/.(jpg|jpeg|png)/.test(_file.name.slice(_file.name.lastIndexOf('.'))) === false) {
            alert("Please select image files only.");
            return false;
        } else {
            $(this).next('.custom-file-label').html(_file.name);
        }
    });

    $("form").on("submit", function () {
        validateForm(this);
        var _formData = new FormData(this);
        if ($(this).is(":valid")) {
            toggleFormDisabled(true);
            if (!currentBrand.standards.filter(function (t) { return t.name === $(this).find("#componentName").val(); }).length) {

                var callback = function () {
                    var options = {
                        type: "POST",
                        url: imageServiceBaseUrl + "imageUpload",
                        data: _formData,
                        enctype: "multipart/form-data",
                        cache: false,
                        contentType: false,
                        processData: false,
                        beforeSend: function () {
                            console.log('Uploading is starting.');
                        },
                        //Successful upload of image
                        success: function (responseText, statusText, xhr, $form) {
                            console.log('Image uploaded');
                            // console.log('status: ' + statusText + '\n\nResponse Text: ' + responseText);
                            currentBrand.standards.push({
                                name: $("form").find("#componentName").val(),
                                url: responseText,
                                referencePage: $("form").find("#referencePage").val()
                            });

                            $.ajax({
                                type: "POST",
                                url: imageServiceBaseUrl + "updateImageStandard",
                                data: JSON.stringify(currentBrand),
                                contentType: "application/json",
                                success: function (responseText, statusText, xhr, $form) {
                                    console.log(responseText);
                                    $("#confirm").modal('hide');
                                    toggleFormDisabled(false);
                                },
                                error: function (xhr, status, error) {
                                    console.log(error);
                                }
                            });
                        },
                        error: function (xhr, status, error) {
                            console.log(error);
                        }
                    };

                    //Image upload call
                    $.ajax(options);
                };

                // Show on page
                setupFileReader($(this).find(".image-btn")[0].files[0], $imageUploadTemplate,
                    $(".image-data .add-config"), $(this).find("#componentName").val(), callback);

                // always return false to prevent standard browser submit and page navigation 
                return false;
            } else {
                alert("A component with same name already exists!");
            }
        }
        return false;
    });

    // $(".btn-danger").on("click", function () {
    //     window.location.reload();
    // });

    $('#confirm').on('hidden.bs.modal', function () {
        // do something...
        $("form").trigger("reset").attr("class", "needs-validation");
        $(".image-btn + label").html("Choose file");
    });
});

function validateForm(form) {
    if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
    }
    form.classList.add('was-validated');
}

function toggleFormDisabled(isDisabled = true) {
    if (isDisabled) {
        $("form input, form button").attr("disabled", "");
    } else {
        $("form input, form button").removeAttr("disabled");
    }
}

function loadBrandConfig(brandname) {
    currentBrand = allBrandsConfig.filter(function (t) {
        return t.brand === brandname;
    })[0];

    if (currentBrand) {
        currentBrand.standards.forEach(function (x) {
            var $element = $imageUploadTemplate.clone().removeClass("template");
            var $img = $element.find("img")[0];
            $element.find(".image-name").text(x.name);
            $element.find(".reference-url").attr("href", x.referencePage);
            $img.onload = function (e) {
                getImageDetails.call(this);
            };
            $(".image-data .add-config").before($element);
            $($img).attr('src', x.url);

            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', x.url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        $element.find(".size>span").text((xhr.getResponseHeader('Content-Length') / 1024).toFixed(1));
                    }
                }
            };
            xhr.send(null);
        });
    } else {
        currentBrand = {
            brand: $(".site-name").val(),
            standards: []
        };
    }
}

function getBrands() {
    fetch(imageServiceBaseUrl + "getImageStandards").then(function (res) {
        if (res.ok) {
            // if HTTP-status is 200-299
            res.json().then(function (d) {
                if (!d) {
                    return false;
                }
                allBrandsConfig = d;
                d.forEach(function (t) {
                    $(".site-name").append("<option value='" + t.brand + "'>" + t.brand + "</option>");
                });
            }).catch(function () {
                console.log("No record found");
            });
        }
    });
}

function setupFileReader(imgFile, $imageUploadTemplate, $target, imageName, callback) {
    var $element = $imageUploadTemplate.clone().removeClass("template");
    var $img = $element.find("img")[0];
    $element.find(".image-name").text(imageName);
    $img.onload = function (e) {
        getImageDetails.call(this);
    };
    $target.before($element);
    var reader = new FileReader();
    reader.onload = function (e) {
        // console.log(e.target);
        $($img).attr('src', e.target.result);
        $element.find(".size>span").text((imgFile.size / 1024).toFixed(1));
        callback.call();
    };
    reader.readAsDataURL(imgFile);
}

function getImageDetails() {
    var $parent = $(this).parent();
    var r = gcd(this.naturalWidth, this.naturalHeight);
    $parent.find(".dimension>span").text(this.naturalWidth + 'x' + this.naturalHeight);
    $parent.find(".aspect-ratio>span").text(this.naturalWidth / r + ':' + this.naturalHeight / r);
}


/** Greatest Common Diviser */
function gcd(w, h) {
    return (h === 0) ? w : gcd(h, w % h);
}