"use client";

import { Input } from "tdesign-react";
import { SearchIcon } from "tdesign-icons-react";
import style from "./search.module.css";

/** 顶栏搜索框(模板 Search：纯样式占位，与模板一致的“未接数据”状态保留) */
const Search = () => (
  <Input className={style.panel} prefixIcon={<SearchIcon />} placeholder="请输入搜索内容" />
);

export default Search;
