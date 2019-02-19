$(document).ready(function () {
  
  $('[data-mask]').inputmask()

  $('#table').DataTable({
    "columnDefs": [
      {
        "targets": [ 0,1,2,3 ],
        "className": "text-center"
      },
    ],
    "search": {
      "search": getUrlVars()["id"]
    }
  });

  $('#tableBrList').DataTable({
    "columnDefs": [
      {
        "targets": [ 0,1,2,3,4,5 ],
        "className": "text-center"
      },
    ],
  });

  $('#tableMngUser').DataTable({
    "columnDefs": [
      {
        "targets": [ 0,1,2,3,4,5,6,7,8 ],
        "className": "text-center"
      },
      {
        "targets": [ 3,4,7 ],
        "visible": false,
        "searchable" : false,
      }
    ],
    "search": {
      "search": getUrlVars()["id"]
    }
  });

  $('#tableHistory').DataTable({
    "columnDefs": [
      {
        "targets": [ 0,1,2,3,4 ],
        "className": "text-center"
      },
    ],
  });

  $("#table tbody").on("click", "#br", function () {
    var table = $('#table').DataTable().row($(this).parents('tr')).data();
    askUserId(table['0']);
  });

  $("#table tbody").on("click", "#edit", function () {
    var table = $('#table').DataTable().row($(this).parents('tr')).data();
    editBic(table['0'], table['1'], table['2']);
  });

  $("#table tbody").on("click", "#del", function () {
    var table = $('#table').DataTable().row($(this).parents('tr')).data();
    delBic(table['0']);
  });

  $("#tableMngUser tbody").on("click", "#edit", function () {
    var table = $('#tableMngUser').DataTable().row($(this).parents('tr')).data();
    MngUserEdit(table['0'],table['1'],table['2'],table['3'],table['4'],table['5'],table['7']);
  });

  $("#tableMngUser tbody").on("click", "#del", function () {
    var table = $('#tableMngUser').DataTable().row($(this).parents('tr')).data();
    MngUserDel(table['0']);
  });

  $("#addUserButton").click(function () {
    $('#uIdMngUserAdd').val("");
    $('#fnameMngUserAdd').val("");
    $('#lnameMngUserAdd').val("");
    $('#phonMngUserAdd').val("");
    $('#emailMngUserAdd').val("");
    $('#departmentMngUserAdd').val("");
    $('#statusMngUserAdd').val("1");
    $('#addUser').modal('show');
  });

  $("#add").click(function () {
    $('#bIdadd').val("");
    $('#coloradd').val("");
    $('#typeadd').val("");
    $('#addBic').modal('show');
  });
});

function MngUserDel(uIdDelMngUser) {
  $('#uIdDelMngUser').val(uIdDelMngUser);
  $('#delUser').modal('show');
}

function MngUserEdit(uId,fname,lname,phone,email,department,status) {
  $('#uIdMngUser').val(uId);
  $('#fnameMngUser').val(fname);
  $('#lnameMngUser').val(lname);
  $('#phonMngUser').val(phone);
  $('#emailMngUser').val(email);
  $('#departmentMngUser').val(department);
  $('#statusMngUser').val(status);
  $('#editUser').modal('show');
}

function askUserId(bId) {
  $('#bId').val(bId);
  $('#askUserId').modal('show');
}

function editBic(bId, color, type) {
  $('#bId').val(bId);
  $('#color').val(color);
  $('#type').val(type);
  $('#editBic').modal('show');
}

function delBic(bId){
  $('#bIdDel').val(bId);
  $('#delBic').modal('show');
}

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
  vars[key] = value;
  });
  return vars;
  }
