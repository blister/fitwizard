CREATE TABLE users (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
	`password` VARCHAR(200) NOT NULL DEFAULT '',
	`admin` TINYINT(1) NOT NULL DEFAULT 0,
	`developer` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY(`id`)
) Engine=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE char_stats (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `strength` INT UNSIGNED NOT NULL DEFAULT 0,
    `dexterity` INT UNSIGNED NOT NULL DEFAULT 0,
    `constitution` INT UNSIGNED NOT NULL DEFAULT 0,
    `intelligence` INT UNSIGNED NOT NULL DEFAULT 0,
    `wisdom` INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY(`id`),
    INDEX `user_idx` (`user_id`)
) Engine=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE adventures (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `created_on` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active', /* active, retreated, died, won */
    `mode` VARCHAR(20) NOT NULL DEFAULT 'exploring', /* exploring, battle, ...FUTURE */
    `lat` DECIMAL(10,8) NOT NULL,
    `lng` DECIMAL(11, 8) NOT NULL,
    PRIMARY KEY(`id`)
) Engine=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE adventure_ticks (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `adventure_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `tick_on` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `mode` VARCHAR(20) NOT NULL DEFAULT 'exploring', /* exploring, battle, ...FUTURE */
    `lat` DECIMAL(10,8) NOT NULL,
    `lng` DECIMAL(11, 8) NOT NULL,
    PRIMARY KEY(`id`)
) Engine=InnoDB DEFAULT CHARSET=utf8mb4;