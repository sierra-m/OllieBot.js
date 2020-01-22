drop table if exists bot;
drop table if exists guild;
drop table if exists mod_roles;
drop table if exists blocked_commands;
drop table if exists rate_limits;
drop table if exists music_queue;
drop table if exists youtube_feeds;
drop table if exists responses;
drop table if exists birthdays;
drop table if exists self_roles;
drop table if exists image_library;

create table bot (
  id text not null primary key,
  prefix text not null,
  status text,
  check(length(id)>=15)
);

create table guild (
  id text not null primary key,
  join_channel text,
  join_message text,
  leave_channel text,
  leave_message text,
  music_channel text,
  default_role text,
  audit_channel text,
  check(length(id)>=15)
);

create table mod_roles (
  guild_id text not null,
  role_id text not null,
  primary key (guild_id, role_id),
  foreign key (guild_id) references guild (id),
  check(length(guild_id)>=15),
  check(length(role_id)>=15)
);

create table blocked_commands (
  guild_id text not null,
  command text not null,
  primary key (guild_id, command),
  foreign key (guild_id) references guild (id),
  check(length(guild_id)>=15)
);

create table rate_limits (
  guild_id text not null,
  command text not null,
  minutes integer not null,
  primary key (guild_id, command),
  foreign key (guild_id) references guild (id),
  check(length(guild_id)>=15)
);

create table music_queue (
  guild_id text not null,
  position integer not null,
  url text not null,
  title text,
  requester_id text not null,
  primary key (guild_id, position),
  foreign key (guild_id) references guild (id),
  check(length(guild_id)>=15),
  check(length(requester_id)>=15)
);

create table youtube_feeds (
  guild_id text not null,
  youtube_channel_id text not null,
  title text,
  last_video_id text,
  discord_channel_id text not null,
  primary key (guild_id, youtube_channel_id),
  foreign key (guild_id) references guild (id),
  check(length(guild_id)>=15),
  check(length(discord_channel_id)>=15)
);

create table responses (
  guild_id text not null,
  name text not null,
  content text not null,
  is_image integer,
  restricted integer,
  requires_prefix integer,
  rate_limit integer,
  search_type text not null,
  search_pattern text,
  delete_after integer,
  primary key (guild_id, name),
  foreign key (guild_id) references guild (id),
  check(length(guild_id)>=15)
);

create table birthdays (
  guild_id text not null,
  user_id text not null,
  datetime numeric not null,
  primary key (guild_id, user_id),
  foreign key (guild_id) references guild (id),
  check(length(guild_id)>=15)
);

create table self_roles (
  guild_id text not null,
  role_id text not null,
  primary key (guild_id, role_id),
  foreign key (guild_id) references guild (id),
  check(length(guild_id)>=15)
);

create table image_library (
  type text not null,
  url text not null,
  primary key (type, url)
);