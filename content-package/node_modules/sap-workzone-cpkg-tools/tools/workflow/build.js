module.exports.build = async function (dir) {
	const path = require("path"),
		util = require("../util/util.js"),
		{ rimrafSync } = require("rimraf"),
		fs = require("fs-extra"),
		root = path.join(dir, util.relativeDir(dir)),
		packagejson = util.json.fromFile(path.join(root, "package.json")),
		name = packagejson.name,
		dist = path.join(root, "dist"),
		src = path.join(root, "src"),
		out = path.join(root, name + ".zip");


	util.log.fancy("Building Workflow Package...");
	console.log(" - Clean files and folders");

	rimrafSync(dist);
	fs.removeSync(out);

	console.log(" - Create dist folder with sources");
	fs.copySync(src, dist);
	util.i18n.process(path.join(dist, "manifest.json"));

	console.log(" - Zip content to " + name + ".zip");
	await util.zip.folder(out, dist);

	util.log.fancy("Building Workflow Package finished successful");
}