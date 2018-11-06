const { querydb } = require('./utils');
const logger = require('./logger');

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
    const query = `INSERT INTO forums (title, description, category_id, is_locked) VALUES(?, ?, ?, ?)`;
    locked = locked == 'true' ? 1 : 0;
    const forum_id = await querydb(query, [title, desc, category_id, locked]).catch(logger.error);
    return forum_id.insertId;
};

exports.getForums = async () => {
    const query = `select a.*, count(b.id) as thread_count from forums a left join forum_threads b on (a.id = b.forum_id) group by id order by a.weight`;
    const forums = await querydb(query).catch(logger.error);
    for (let i = 0; i < forums.length; i++) {
        let latest = await this.getLatestThread(forums[i].id);
        if (latest.length > 0) forums[i].latestThread = latest[0];
    }
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
