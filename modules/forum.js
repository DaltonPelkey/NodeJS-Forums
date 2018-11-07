const { querydb } = require('./utils');
const logger = require('./logger');
const slug = require('slug');

exports.getCategory = async title => {
    const query = `SELECT * FROM forum_categories WHERE LOWER(title) = ?`;
    let category = await querydb(query, title.toLowerCase()).catch(logger.error);
    if (category.length < 1) category = await this.addCategory(title);
    if (category.length > 0) category = category[0];
    return category;
};

exports.addCategory = async category => {
    await querydb(`INSERT INTO forum_categories (title) VALUES(?)`, category).catch(logger.error);
    const newCategory = await querydb(`SELECT * FROM forum_categories WHERE LOWER(title) = ?`, category.toLowerCase()).catch(logger.error);
    return newCategory[0];
};

exports.newForum = async (title, desc, category_id, locked) => {
    locked = locked == 'true' ? 1 : 0;
    const forum = await querydb(`INSERT INTO forums (title, description, category_id, is_locked) VALUES(?, ?, ?, ?)`, [title, desc, category_id, locked]).catch(logger.error);
    const forumSlug = `${forum.insertId}-${slug(title, {lower: true})}`;
    await querydb("UPDATE forums SET slug = ? WHERE id = ?", [forumSlug, forum.insertId]).catch(logger.error);
    return forum.insertId;
};

exports.getForum = async id => {
    const forum = await querydb("SELECT * FROM forums WHERE id = ?", id).catch(logger.error);
    return forum;
};

exports.getForums = async parent_id => {
    let query, forums;
    if (!parent_id) {
        query = "SELECT a.*, COUNT(b.id) AS thread_count FROM forums a LEFT JOIN forum_threads b ON (a.id = b.forum_id) GROUP BY id ORDER BY a.weight";
        forums = await querydb(query).catch(logger.error);
    } else {
        query = "SELECT a.*, COUNT(b.id) AS thread_count FROM forums a LEFT JOIN forum_threads b ON (a.id = b.forum_id) WHERE a.parent_forum_id = ? GROUP BY id ORDER BY a.date_created DESC";
        forums = await querydb(query, parent_id).catch(logger.error);
    }
    for (let i = 0; i < forums.length; i++) {
        let latest = await this.getLatestThread(forums[i].id);
        let children = await this.getChildForums(forums[i].id);
        if (latest.length > 0) forums[i].latestThread = latest[0];
        if (children.length > 0) forums[i].childForums = children;
    }
    return forums;
};

exports.getThreads = async forum_id => {
    const query = `SELECT a.*, COUNT(b.id) AS comment_count FROM forum_threads a LEFT JOIN forum_comments b ON (a.id = b.thread_id) WHERE a.id = ? GROUP BY id ORDER BY a.date_created DESC LIMIT ${(page - 1) * itemsPerPage}, ${itemsPerPage}`;
    const threads = await querydb(query, forum_id).catch(logger.error);
    const count = await querydb("SELECT COUNT(*) FROM forum_threads WHERE forum_id = ?", forum_id).catch(logger.error);

    return {threadCount: count, threads: threads};
};

exports.getChildForums = async parent_id => {
    const query = "SELECT title, description, slug, is_locked FROM forums WHERE parent_forum_id = ?";
    const forums = querydb(query, parent_id).catch(logger.error);
    return forums;
};

exports.getLatestThread = async forum_id => {
    const query = `select a.title, a.date_created, b.username as author_username from forum_threads a left join accounts b on (a.author_id = b.id) where a.id = ?`
    const latest = await querydb(query, forum_id).catch(logger.error);
    return latest;
};

exports.getCategories = async () => {
    const query = `SELECT * FROM forum_categories ORDER BY weight;`
    const categories = await querydb(query).catch(logger.error);
    return categories;
};

exports.deleteCategory = async id => {
    await querydb('DELETE FROM forums WHERE category_id = ?', id).catch(logger.error);
    await querydb('DELETE FROM forum_categories WHERE id = ?', id).catch(logger.error);
    return true;
};

exports.renameCategory = async (id, name) => {
    await querydb("UPDATE forum_categories SET title = ? WHERE id = ?", [name, id]).catch(logger.error);
    return true;
};

exports.changeCategoryWeights = async (arr) => {
    arr.forEach((e, i) => {
        querydb("UPDATE forum_categories SET weight = ? WHERE id = ?", [i, e]).catch(logger.error);
    });
    return true;
};

exports.changeForumWeights = async (arr) => {
    arr.forEach((e, i) => {
        querydb("UPDATE forums SET weight = ? WHERE id = ?", [i, e]).catch(logger.error);
    });
    return true;
};
