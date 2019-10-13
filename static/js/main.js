var crisprData;
var fileID;

$('.progress').hide();

var btnClick = function (value, object) {
    //Clear result section and show progress bar
    $('#findBtn').addClass('disabled');
    $('#results').html("");
    $('.progress-bar').css('width', '50%');
    $('.progress-bar').html('Getting the json data');
    $('.progress').show();

    if(value=='upload') {
        // Upload sequence file
        var fd = new FormData($("#fileinfo")[0]);

        // Ajax call to upload file and display the visualization
        $.ajax({
            url: '/uploader',
            type: 'POST',
            data: fd,
            success: function (data) {
                $('.progress-bar').html('Creating Visualization');
                $('.progress-bar').css('width', '90%');
                fileID = data['file_name']
                displayResult(data);
            },
            error: function (data) {
                displayError('Sorry, some unexpected error occured during file upload!');
            },
            cache: false,
            contentType: false,
            processData: false
        });
    } else {
        // Show example sequences
        fileID = value;
        $.getJSON( "static/sequences/"+fileID+".json", function( data ) { 
            displayResult(data);
        });
    }

};


$('#inputGroupFile01').on('change', function () {
    //get the file name
    var fileName = $(this).val();
    //replace the "Choose a file" label
    $(this).next('.custom-file-label').html(fileName);
})

$('#exampleModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget) // Button that triggered the modal

    $('#modal-content').html(`
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        `);

    var modal = $(this)

    switch (button.data('modal-type')) {
        case ("Repeat Weblogo"):
            var id = button.data('ciripr-id') // Extract info from data-* attributes
            var repeats = []
            crisprData[id]['spacerRepeat'].forEach(function (value) {
                repeats.push(value['repeat']);
            });

            // Generate the web logo from the list of repeat sequences
            $.ajax({
                url: '/generate_image/' + fileID,
                type: 'POST',
                data: JSON.stringify(repeats),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (d) {
                    modal.find('#modal-content').html(`
                    <div class="text-center">
                        <img src="static/logos/`+ fileID + `.png" class="img-fluid" />
                    </div>
                    `);
                },
                failure: function (d) {
                    console.log('error')
                }
            });
            break;
        case ("Sequence Structure"):
            var crSeq = button.data('ciripr-seq') // Extract info from data-* attributes
            var rand = Math.floor(Math.random() * 1000);
            // Generate the 2D structure of the spacer/repeat sequence
            $.ajax({
                url: '/generate_structure/' + fileID + '_' + rand,
                type: 'POST',
                data: JSON.stringify({ "seq": crSeq }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (d) {
                    // Display the 2D structure and the button to blast the structure on NCBI
                    modal.find('#modal-content').html(`
                    <div class="text-center">
                    <img src="static/logos/`+ fileID + `_` + rand + `.svg" type="image/svg+xml" />
                    <a target="_blank" href="https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Put&QUERY=`+ crSeq + `&PROGRAM=blastn&FORMAT_TYPE=html&DATABASE=nr" class="btn btn-secondary btn-lg active" role="button" aria-pressed="true">Blast on NCBI</a>
                    </div>                    
                    `);
                },
                failure: function (d) {
                    console.log('error')
                }
            });
            break;
        case ("CRISPR Structure"):
            var id = button.data('ciripr-id') // Extract info from data-* attributes
            var repeats = []
            requestJson = {}
            requestJson['spacerRepeats'] = crisprData[id]['spacerRepeat'];
            requestJson['length'] = button.data('crispr-length')
            var rand = Math.floor(Math.random() * 1000);
            // Function to create the CSRISPR structure image
            $.ajax({
                url: '/generate_dna_struct/' + fileID + '_' + rand,
                type: 'POST',
                data: JSON.stringify(requestJson),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (d) {
                    modal.find('#modal-content').html(`
                    <div class="text-center">
                        <img src="static/logos/`+ fileID + `_` + rand + `.png" class="img-fluid" />
                    </div>
                    `);
                },
                failure: function (d) {
                    console.log('error')
                }
            });
            break;
    }
    modal.find('.modal-title').text(button.data('modal-type'))
})


// Displays an error message in an alert box
function displayError(msg) {
    $('#results').html(`
    <div class="alert alert-danger" role="alert">
    `+ msg + `
    </div>
    `);
    $('#findBtn').removeClass('disabled');
    $("#fasta-sequence").val("");
    $('.progress').hide();
}

// Displays the final visualization using the data from the json file
function displayResult(data) {
    $("#findBtn").removeClass('disabled');
    $("#fasta-sequence").val("");
    $('.progress').hide();
    $('#results').html(createResults(data));
}

// Creates the visualizations using multiple components from Bootstrap
function createResults(data) {
    content = `
    <div class="alert alert-light" role="alert">
    <h5 class="alert-heading">Organism </h5>` +
        data['organism'] +
        `<hr>
    <p class="mb-0">
    <span class="badge badge-pill badge-secondary"> No. of Bases: ` + data['noOfBases'] + `</span>
    <span class="badge badge-pill badge-light">No. of confirmed CRISPRs: `+ data['validCrisprs'] + `</span>
    <span class="badge badge-pill badge-secondary">No. of questionable CRISPRs: `+ (data['noOfCRISPRs'] - data['validCrisprs']) + `</span>
    </p>
    </div>
    <div id="accordion">`
    content += getTables(true, data);
    content += `<br/>`
    content += getTables(false, data);

    content += `</div></div></div>`

    return content;
}

// Creates tables for each of the CRISPR arrays
function getTables(isValid, data) {
    table_content = `
    <div class="card">
    <div class="card-header" id="headingTwo">
    <h5 class="mb-0"> `+ ((isValid) ? (`<button class="btn" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true"
    aria-controls="collapseOne">
    Confirmed CRISPRs <span class="badge badge-dark">` + data['validCrisprs'] + `</span>
</button>`) : (`
    <button class="btn collapsed" data-toggle="collapse" data-target="#collapseTwo"
                                aria-expanded="false" aria-controls="collapseTwo">
        Questionable CRISPRs <span class="badge badge-dark"> `+ (data['noOfCRISPRs'] - data['validCrisprs']) + ` </span>
    </button>` )) + `
    </h5>
    </div>`+ (isValid ? `<div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordion">` :
            `<div id="collapseTwo" class="collapse" aria-labelledby="headingTwo" data-parent="#accordion">`)
        + `<div class="card-body">
    <table class="table table-hover">
    <thead>
    <tr>
    <th scope="col">ID</th>
    <th scope="col">Start Position</th>
    <th scope="col">End Position</th>
    <th scope="col">Average Repeat Length</th>
    <th scope="col">Average Spacer Length</th>
    </tr>
    </thead><tbody>`
    data['CRISPRs'].forEach(function (value, i) {
        if (value['isValid'] == isValid) {
            table_content += `
        <tr class='resultRow'>
        <a href='#`+ i + `'>
        <th scope="row"><a class="text-secondary" href='#`+ i + `'>CRISPR_` + (i + 1) + `</a></th>
        <td>`+ value['startRange'] + `</td>
        <td>`+ value['endRange'] + `</td>
        <td>`+ value['avgRLength'] + `</td>
        <td>`+ value['avgSLength'] + `</td>
        </a>
        </tr>`
        }
    });
    table_content += `</tbody></table>`
    crisprData = data['CRISPRs']
    data['CRISPRs'].forEach(function (value, i) {
        if (value['isValid'] == isValid) {
            table_content += `
        
        <div id="`+ i + `" class="card border-secondary mb-3">
                                <div class="card-header">CRISPR `+ (i + 1) + ` : <span class="text-muted">Range: ` + value['startRange'] + ` - ` + value['endRange'] + ` </span>
                                </div>
                                <div class="card-body text-secondary">
                                    <p class="card-text">
                                        <p class="mb-0">
                                            <span class="alert alert-secondary" role="alert">No. of Repeats: `+ value['noOfRepeats'] + `</span>
                                            <span class="alert alert-secondary" role="alert">Average Spacer Length: `+ value['avgSLength'] + `</span>
                                            <span class="alert alert-secondary" role="alert">Average Repeat Length: `+ value['avgRLength'] + `</span>
                                        </p>
                                        <br />
                                        <div class="table-responsive">
                                        <table class="table table-sm table-bordered text-center">
                                            <thead>
                                                <tr>
                                                    <th scope="col" colspan="3" >REPEAT</th>
                                                    <th scope="col" colspan="3" class="table-secondary">SPACER</th>
                                                </tr>
                                            </thead>
                                            <tr>
                                                <th scope="col">REPEAT Sequence</th>
                                                <th scope="col">POSITION</th>
                                                <th scope="col">LENGTH</th>
                                                <th scope="col" class="table-secondary">SPACER Sequence</th>
                                                <th scope="col" class="table-secondary">POSITION</th>
                                                <th scope="col" class="table-secondary">LENGTH</th>
                                            </tr>
                                            <tbody>`
            value['spacerRepeat'].forEach(function (value, i) {
                if (value['spacer']) {
                    table_content += `<tr>
                            <td scope="row"><button type="button" class="btn btn-sm" data-toggle="modal" data-target="#exampleModal" data-ciripr-seq="`+ value['repeat'].trim() + `
                            " data-modal-type="Sequence Structure" data-file-name=`+ fileID + `>` + value['repeat'] + `</button></td>
                            <td>`+ value['position'] + `</td>
                            <td>`+ value['lengths'][0] + `</td>
                            <td class="table-secondary"><button type="button" class="btn btn-sm" data-toggle="modal" data-target="#exampleModal" data-ciripr-seq="`+ value['spacer'].trim() + `
                            " data-modal-type="Sequence Structure" data-file-name=`+ fileID + `>` + value['spacer'] + `</button></td>
                            <td class="table-secondary">`+ (value['position'] + value['lengths'][0]) + `</td>
                            <td class="table-secondary">`+ value['lengths'][1] + `</td>
                        </tr>`;
                } else {
                    table_content += `<tr>
                            <td scope="row"><button type="button" class="btn btn-sm" data-toggle="modal" data-target="#exampleModal" data-ciripr-seq="`+ value['repeat'].trim() + `
                            " data-modal-type="Sequence Structure" data-file-name=`+ fileID + `>` + value['repeat'] + `</button></td>
                            <td>`+ value['position'] + `</td>
                            <td>`+ value['repeat'].length + `</td>
                            <td class="table-secondary">-</td>
                            <td class="table-secondary">-</td>
                            <td class="table-secondary">-</td>
                        </tr>`;
                }
            });
            table_content += `</tbody></table></div>
        <button type="button" class="btn btn-secondary " data-toggle="modal"
            data-target="#exampleModal" data-ciripr-id="`+ i + `" data-modal-type="Repeat Weblogo" data-file-name=` + fileID + `>Repeat weblogo</button>
            <button type="button" class="btn btn-secondary " data-toggle="modal"
            data-target="#exampleModal" data-ciripr-id="`+ i + `" data-crispr-length="` + data['noOfBases'] + `" data-modal-type="CRISPR Structure" data-file-name=` + fileID + `>CRISPR Structure</button>
            </p>
            </div>
        </div>`}
    });

    table_content += `</div></div></div>`

    return table_content
}
