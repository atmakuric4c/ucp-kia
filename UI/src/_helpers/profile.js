function flatToMultiLevel(list){

    let map = {}, node, roots = [], i;
  
    for (i = 0; i < list.length; i += 1) {
        map[list[i].id] = i; // initialize the map
        list[i].child = []; // initialize the child
    }
    
    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.parent_id !== 0 && map[node.parent_id]) {
        // if you have dangling branches check that map[node.parentId] exists
            list[map[node.parent_id]].child.push(node);
        } else if(node.parent_id === 0){
            roots.push(node);
        }
    }

    return roots;

}

export const profileCommon = {
    flatToMultiLevel
}