/**
 * Created by Alicia on 4/23/17.
 */

d3.queue()
    .defer(d3.json, "../scroll_demo/data/RouaultOutput.json")
    .await(processData);


function processData(error, data) {
    if (error) throw error;
    var newDataset = [];
    console.log(data);
    data.forEach(function (d, i) {
        var newRecord = {
            name: null,
            sex: null,
            birthDate: null,
            birthPlace: null,
            deathDate: null,
            deathPlace: null,
        };
        var dataTree = d.tree;
        dataTree.forEach(function (e, i) {
            if (e.tag == "BIRT") {
                var birthTree = e.tree;
                birthTree.forEach(function (f, i) {
                    if (f.tag == "DATE") {
                        newRecord.birthDate = f.data
                    }
                    if (f.tag == "PLAC") {
                        newRecord.birthPlace = f.data
                    }
                })

            }
            else if (e.tag == "DEAT") {
                var deathTree = e.tree;
                deathTree.forEach(function (f, i) {
                    if (f.tag == "DATE") {
                        newRecord.birthDate = f.data
                    }
                    if (f.tag == "PLAC") {
                        newRecord.birthPlace = f.data
                    }
                })
            }
            else if (e.tag == "NAME") {
                newRecord.name = e.data;
            }
            else if (e.tag == "SEX") {
                newRecord.sex = e.data;
            }
        })
        newDataset.push(newRecord);
    })
    console.log(JSON.stringify(newDataset));
}