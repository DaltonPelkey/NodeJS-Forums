//Set minimum roles that will have permission to perform actions
//Role order: Administrator, Moderator, Member
exports.forums = {
    view_forums: "Everyone",
    create_forum: "Administrator",
    create_thread: "Member",
    delete_category: "Administrator",
    rename_category: "Administrator",
    reorder_category: "Member", // Only on client side
    reorder_default_category: "Administrator", // Change default order for all users who haven't set their own
    reorder_forum: "Member", // Only on client side
    reorder_default_forum: "Administrator", // Change default order for all users who haven't set their own
    post_in_locked_forums: "Moderator"
};

exports.api = {
    get_profile: "Everyone" // Everyone is required for basic site functionality
}

exports.levels = {
    "Banned": -1,
    "Member": 0,
    "Moderator": 1,
    "Administrator": 2
}
