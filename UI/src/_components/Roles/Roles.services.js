import config from "config";
import { authHeader, ucpEncrypt, ucpDecrypt, decryptResponse } from "../../_helpers";

export const RolesService = {
  getAll,
  getUserAll,
  getAllRoles,
  addUser,
  update,
  getAllAssignUsers,
};


function handleEncResponse(response) {
  return response.text().then(text => {
    let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        if(response.message=='')
        location.reload(true);
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }

    return data;
  });
}

function handleEncRolesResponse(response) {
  return response.text().then(text => {
    let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

    data = data && JSON.parse(ucpDecrypt(JSON.parse(data)));
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        if(response.message=='')
        location.reload(true);
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }

    return data;
  });
}

function getAll(params) {
  let is_manager_flag = 0,
    user = decryptResponse(localStorage.getItem("user")),
    manager_resource_groups = {},
    assigned_resource_groups = user.data.resource_groups.map(resource => {
      if (resource.role_id === 3) {
        manager_resource_groups[resource.name] = true
        is_manager_flag = 1;
      }
      return resource.name;
    });

  //console.log('user.data.resource_groups',user.data.resource_groups);

  let formdata = {
    current_user_id: user.data.id,
    superAdmin: user.data.isSuperAdmin,
    is_manager_flag:is_manager_flag,
    assigned_resource_groups:assigned_resource_groups,
  };
 
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ucpEncrypt(formdata))
  };

  return fetch(`${config.apiUrl}/secureApi/roles/getAllResourceGroupList`, requestOptions).then(
		  handleEncResponse
  );

}

function getUserAll(params) {
  let is_manager_flag = 0,
    user = decryptResponse(localStorage.getItem("user")),
    manager_resource_groups = {},
    assigned_resource_groups = user.data.resource_groups.map(resource => {
      if (resource.role_id === 3) {
        manager_resource_groups[resource.name] = true
        is_manager_flag = 1;
      }
      return resource.name;
    });

  let formdata = {
    superAdmin: '1',
    resource_group_id: params.resource_group_id
  };
 
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ucpEncrypt(formdata))
  };

  return fetch(`${config.apiUrl}/secureApi/roles/getAllUserResourceGroupList`, requestOptions).then(
		  handleEncResponse
  );

}


function getAllRoles(params) {
  const requestOptions = {
    method: "GET",
    headers: { ...authHeader(), "Content-Type": "application/json" },
  };
  return fetch(`${config.apiUrl}/secureApi/roles/getRolePermissionList`, requestOptions).then(
		  handleEncRolesResponse
  );
}

function getAllAssignUsers(params) {
  const requestOptions = {
    method: "GET",
    headers: { ...authHeader(), "Content-Type": "application/json" },
  };
  return fetch(`${config.apiUrl}/secureApi/roles/getUserRoleList`, requestOptions).then(
		  handleEncRolesResponse
  );
}

function addUser(userdata) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ucpEncrypt(userdata))
  };

  return fetch(`${config.apiUrl}/secureApi/users`, requestOptions).then(
		  handleEncResponse
  );
}

function update(userdata) {
  const requestOptions = {
    method: "PUT",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ucpEncrypt(userdata))
  };

  return fetch(
    `${config.apiUrl}/secureApi/users/${userdata.id}`,
    requestOptions
  ).then(handleEncResponse);
}

function handleResponse(response) {
  // console.log("response === "+JSON.stringify(response));
  return response.text().then(text => {
    let data = text && JSON.parse(ucpDecrypt(text));
    data = data && JSON.parse(ucpDecrypt(data));
    if (!response.ok) {
      if (response.status === 401) {
        // auto logout if 401 response returned from api
        logout();
        if(response.message=='')
        location.reload(true);
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }

    return data;
  });
}

