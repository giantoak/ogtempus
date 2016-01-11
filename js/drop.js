$(document).ready(function() {});

var dat = []


$.get('https://www.quandl.com/api/v1/datasets/BAVERAGE/USD.json?trim_start=2012-12-30&trim_end=2014-11-11&auth_token=wtEcBRATQ9CToGYSrjs4', function(data) {
    new_data = data['data'].map(function(x) {
        return {
            "date": new Date(x[0]),
            value: x[1]
        }
    });
    dat = new_data
    $('#output').append('<div id="new">')
    var chart_count = 1
    MG.data_graphic({
        title: "Raw data",
        data: new_data,
        width: screen.width - 100,
        height: 250,
        area: true,
        linked: true,
        xax_count: 14,
        target: '#new',
        area: false,
        x_accessor: 'date',
        y_accessor: 'value'
    })

    $(function() {
        $(".dropdown-menu li a").click(function() {
            var selText = $(this).text();
            var query_url;
            $(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
            if (selText == 'ARIMA') {
                $.ajax({
                    type: "POST",
                    url: "opencpu_example/arima",
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        date: new_data.map(function(x) {
                            return x['date']
                        }),
                        value: new_data.map(function(x) {
                            return x['value']
                        })
                    }),
                    success: function(data) {
                        console.log("Success!")
                        var data2 = [];
                        for (var i = 0; i < data['dates'].length; i++) {
                            data2.push({
                                'lb': data['lb'][i],
                                'ub': data['ub'][i],
                                'date': new Date(data['dates'][i]),
                                'value': data['resid'][i]
                            })
                        }
                        console.log(data2)

                        var pv = data['p.value']
                        if (pv < 0.01) {
                            var pvalue = "very strong presumption against null hypothesis"
                            var indicator = ' fa-exclamation-triangle" style="color:red"'

                        } else if (0.01 < pv & pv <= 0.05) {
                            var pvalue = "strong presumption against null hypothesis"
                            var indicator = ' fa-exclamation-triangle" style="color:orange"'
                        } else if (0.05 < pv & pv <= 0.1) {
                            var pvalue = "low presumption against null hypothesis"
                            var indicator = ' fa-check-circle" style="color:yellow"'
                        } else {
                            var pvalue = "no presumption against the null hypothesis"
                            var indicator = ' fa-check-circle" style="color:green"'
                        }

                        $('#output').append('<div id="trunk">')
                        $('#trunk').append('<div id="res1" class="col-lg-8">')
                        $('#trunk').append('<div id="res2" class="col-lg-4">')
                        $('#output').append('<br>')
                        MG.data_graphic({
                            title: "Residuals",
                            description: "This displays the residuals from an ARIMA model",
                            data: data2,
                            width: 750,
                            height: 250,
                            target: '#res1',
                            x_accessor: 'date',
                            linked: true,
                            show_confidence_band: ['lb', 'ub'],
                            xax_count: 12,
                            area: false,
                            y_accessor: 'value',
                        })
                        ma = "";
                        ar = ""
                        for (var i = 0; i < data['theta'].length; i++) {
                            if (data['theta'][i] >= 0) {
                                st = '}+'
                            } else {
                                st = '}-'
                            }

                            ma += data['theta'][i] + ' \\epsilon_{t-' + (i + 1) + st
                        }
                        st = ""
                        for (var i = 0; i < data['phi'].length; i++) {
                            if (data['phi'][i] >= 0) {
                                st = '+'
                            } else {
                                st = '-'
                            }
                            ar += st + Math.abs(data['phi'][i]) + 'y_{t-' + (i + 1) + '}'
                        }
                        ma = ma.substring(0, ma.length - 1);
                        //ar = ar.substring(0, ar.length - 1);
                        console.log(data['theta'])
                        console.log(ar)
                        $('#res2').append('<h2 >Estimated model <i id="indicator"  data-toggle="popover"  title="Legend" class="fa' + indicator + '></i></h2><br><p>The model was estimated as ARIMA(' + data['phi'].length + ',' + data['D'] + ',' + data['phi'].length + ') with the following parameters: <p style="text-align:center">$$(1-L)^' + data['D'] + 'y_t = ' + ar + '+\\epsilon_t' + ma + '$$</p><br><p>The p-value associated with the Box-Pierce test was: ' + data['p.value'] + ' which indicates ' + pvalue + ' of white noise residuals.</p>');
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub, 'res2']);
                        $('#indicator').attr('data-content', '<i class="fa fa-exclamation-triangle" style="color:red"></i> - Warning<br><i class="fa fa-exclamation-triangle" style="color:orange"></i> - Caution<br><i class="fa fa-check-circle" style="color:GreenYellow;"></i> - Fair<br><i class="fa fa-check-circle" style="color:green"></i> - Good<br>');

                        $('[data-toggle="popover"]').popover({
                            html: true,
                            content: function() {
                                return $('#indicator').html();
                            },
                            trigger: 'hover',
                            'placement': 'top'
                        });
                    }
                });

            } else if (selText == 'Seasonal Trend Decomposition') {
                $('a.external').prop('href', "http://en.wikipedia.org/wiki/Decomposition_of_time_series");
                query_url = "stl_test"
                console.log(new_data)
                $.ajax({
                    type: "POST",
                    url: "opencpu_example/get",
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        date: new_data.map(function(x) {
                            return x['date']
                        }),
                        value: new_data.map(function(x) {
                            return x['value']
                        })
                    }),
                    success: function(data) {
                        console.log("Success!")
                        console.log(data)
                        es = data
                        for (var key in Object.keys(es)) {
                            $('#output').append('<div id="' + Object.keys(es)[key] + '">')
                            chart_count += 1
                            console.log('#' + Object.keys(es)[key])
                            MG.data_graphic({
                                title: Object.keys(es)[key] + ' component',
                                data: es[Object.keys(es)[key]].map(function(x) {
                                    return {
                                        "date": new Date(x['date']),
                                        value: x['value']
                                    }
                                }),
                                width: screen.width - 150,
                                height: 250,
                                target: '#' + Object.keys(es)[key],
                                x_accessor: 'date',
                                linked: true,
                                xax_count: 14,
                                area: false,
                                y_accessor: 'value',
                            })
                        }
                    }
                });

            } else if (selText == 'Breakpoint Detection') {
                $.ajax({
                    type: "POST",
                    url: "opencpu_example/bo",
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        date: new_data.map(function(x) {
                            return x['date']
                        }),
                        value: new_data.map(function(x) {
                            return x['value']
                        })
                    }),
                    success: function(data) {
                        console.log("Success!")
                        console.log(data)
                        var markers = [{
                            'date': new Date(new_data.map(function(x) {
                                return x['date']
                            })[data['loc']]),
                            'label': "Breakpoint"
                        }];
                        MG.data_graphic({
                            title: "Raw data",
                            data: new_data.map(function(x) {
                                return {
                                    "date": new Date(x['date']),
                                    value: x['value']
                                }
                            }),
                            width: screen.width - 150,
                            height: 250,
                            target: '#new',
                            markers: markers,
                            x_accessor: 'date',
                            linked: true,
                            xax_count: 12,
                            area: false,
                            y_accessor: 'value',
                        })
                    }
                });

            } else if (selText == 'Causal Impact') {
                $.ajax({
                    type: "POST",
                    url: "opencpu_example/ci",
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        date: dat.map(function(x) {
                            return x['date']
                        }),
                        value: dat.map(function(x) {
                            return x['value']
                        }),
                        bp: 70
                    }),
                    success: function(data) {
                        console.log("Success!")
                        console.log(data)
                        var data2 = [];
                        for (var i = 0; i < data['series'].length; i++) {
                            data2.push({
                                'response': data['series'][i][0],
                                'point.pred': data['series'][i][2],
                                'point.pred.lower': data['series'][i][3],
                                'point.pred.upper': data['series'][i][4],
                                'date': data['date'][i],
                                'point.effect': data['series'][i][8],
                                'point.effect.lower': data['series'][i][9],
                                'point.effect.upper': data['series'][i][10],
                                'cum.effect': data['series'][i][11],
                                'cum.effect.lower': data['series'][i][12],
                                'cum.effect.upper': data['series'][i][13]
                            })
                        }
                        $('#output').append('<div id="ci-1">')
                        $('#output').append('<div id="ci-2">')
                        $('#output').append('<div id="ci-3">')
                        console.log(data2)
                        var markers = [{
                            'date': new Date(data['date'].map(function(x) {
                                return x['date']
                            })[70]),
                            'label': "Intervention"
                        }];
                        console.log(markers)
                        MG.data_graphic({
                            title: "Original",
                            data: data2.map(function(x) {
                                return {
                                    "date": new Date(x['date']),
                                    "value": x['response'],
                                    "l": x['point.pred.lower'],
                                    "u": x['point.pred.upper']
                                }
                            }),
                            width: screen.width - 150,
                            height: 250,
                            target: '#ci-1',
                            x_accessor: 'date',
                            linked: true,
                            markers: markers,
                            show_confidence_band: ['l', 'u'],
                            xax_count: 12,
                            area: false,
                            y_accessor: 'value',
                        })
                        MG.data_graphic({
                            title: "Point Effect",
                            data: data2.map(function(x) {
                                return {
                                    "date": new Date(x['date']),
                                    "value": x['point.effect'],
                                    "l": x['point.effect.lower'],
                                    "u": x['point.effect.upper']
                                }
                            }),
                            width: screen.width - 150,
                            height: 250,
                            target: '#ci-2',
                            x_accessor: 'date',
                            linked: true,
                            show_confidence_band: ['l', 'u'],
                            xax_count: 12,
                            area: false,
                            y_accessor: 'value',
                        })
                        MG.data_graphic({
                            title: "Cumulative Effect",
                            data: data2.map(function(x) {
                                return {
                                    "date": new Date(x['date']),
                                    "value": x['cum.effect'],
                                    "l": x['cum.effect.lower'],
                                    "u": x['cum.effect.upper']
                                }
                            }),
                            width: screen.width - 150,
                            height: 250,
                            target: '#ci-3',
                            x_accessor: 'date',
                            linked: true,
                            show_confidence_band: ['l', 'u'],
                            xax_count: 12,
                            area: false,
                            y_accessor: 'value',
                        })
                    }
                });

            } else if (selText == 'MMPP') {

            } else if (selText == 'Anomaly Detection') {
                $.ajax({
                    type: "POST",
                    url: "opencpu_example/anomaly",
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        date: dat.map(function(x) {
                            return x['date']
                        }),
                        value: dat.map(function(x) {
                            return x['value']
                        })
                    }),
                    success: function(data) {
                        console.log("Success!")
                        console.log(data)
                    }
                });

            } else {
                $('a.external').prop('href', "http://en.wikipedia.org/wiki/Change_detection");
                $.ajax({
                    type: "POST",
                    url: "opencpu_example/bcp",
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        date: new_data.map(function(x) {
                            return x['date']
                        }),
                        value: new_data.map(function(x) {
                            return x['value']
                        })
                    }),
                    success: function(data) {
                        console.log("Success!")
                        console.log(data)
                        $('#output').append('<div id="bcp">')
                        MG.data_graphic({
                            title: "Changepoint probability",
                            description: "This displays the posterior probability of a change point at each point in time",
                            data: data.map(function(x) {
                                return {
                                    "date": new Date(x['date']),
                                    value: x['value']
                                }
                            }),
                            width: screen.width - 150,
                            height: 250,
                            target: '#bcp',
                            chart_type: 'histogram',
                            x_accessor: 'date',
                            linked: true,
                            xax_count: 12,
                            area: false,
                            binned: true,
                            y_accessor: 'value',
                            min_y: 0
                        })
                    }
                });
            }
        });
    });

    console.log(dat)
});


if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('The File APIs are not fully supported in this browser.');
}

function handleFiles(files) {
    // Check for the various File API support.
    if (window.FileReader) {
        // FileReader are supported.
        getAsText(files[0]);
    } else {
        alert('FileReader are not supported in this browser.');
    }
}

function getAsText(fileToRead) {
    var reader = new FileReader();
    // Handle errors load
    reader.onload = loadHandler;
    reader.onerror = errorHandler;
    // Read file into memory as UTF-8      
    reader.readAsText(fileToRead);
}

function loadHandler(event) {
    var csv = event.target.result;
    processData(csv);
}

function processData(csv) {
    var allTextLines = csv.split(/\r\n|\n/);
    var lines = [];
    var data = [];
    while (allTextLines.length - 1) {
        var temp = allTextLines.shift().split(',');
        lines.push(temp);
        data.push({
                "date": new Date(temp[0]),
                "value": parseFloat(temp[1])
            })
            //data.push({"date1":parseFloat(temp[0]),"value":parseFloat(temp[1])})
    }
    console.log(data);
    new_data = data;
    dat = data;
    drawOutput(data);
}

function errorHandler(evt) {
    if (evt.target.error.name == "NotReadableError") {
        alert("Cannot read file!");
    }
}

function drawOutput(lines) {
    $('#output').append('<div id="new">')
    dat = lines
    MG.data_graphic({
        title: "Raw data",
        data: lines,
        width: screen.width - 100,
        height: 250,
        area: true,
        linked: true,
        xax_count: 14,
        target: '#new',
        area: false,
        x_accessor: 'date',
        y_accessor: 'value'
    })
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    getAsText(files[0]);
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);