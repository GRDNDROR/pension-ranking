CREATE TABLE `data_refresh_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`records_processed` integer,
	`latest_period` integer,
	`started_at` text NOT NULL,
	`completed_at` text,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `fund_characteristics` (
	`fund_id` text PRIMARY KEY NOT NULL,
	`accepts_without_health_declaration` integer,
	`track_flexibility` text,
	`num_tagmulim_tracks` integer,
	`num_pitzuyim_tracks` integer,
	`service_quality_score` real,
	`claims_approval_rate` real,
	`public_complaints_rate` real,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`fund_id`) REFERENCES `pension_funds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `management_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name_hebrew` text NOT NULL,
	`name_english` text,
	`website_url` text
);
--> statement-breakpoint
CREATE TABLE `monthly_performance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fund_id` text NOT NULL,
	`report_period` integer NOT NULL,
	`total_assets` real,
	`deposits` real,
	`withdrawals` real,
	`net_monthly_deposits` real,
	`monthly_yield` real,
	`year_to_date_yield` real,
	`yield_trailing_3_yrs` real,
	`yield_trailing_5_yrs` real,
	`avg_annual_yield_3_yrs` real,
	`avg_annual_yield_5_yrs` real,
	`avg_annual_management_fee` real,
	`avg_deposit_fee` real,
	`sharpe_ratio` real,
	`alpha` real,
	`standard_deviation` real,
	`liquid_assets_percent` real,
	`stock_market_exposure` real,
	`foreign_exposure` real,
	`foreign_currency_exposure` real,
	`actuarial_adjustment` real,
	`fetched_at` text NOT NULL,
	FOREIGN KEY (`fund_id`) REFERENCES `pension_funds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_performance_fund_id_report_period_unique` ON `monthly_performance` (`fund_id`,`report_period`);--> statement-breakpoint
CREATE TABLE `pension_funds` (
	`id` text PRIMARY KEY NOT NULL,
	`external_id` text,
	`company_id` text,
	`name_hebrew` text NOT NULL,
	`fund_type` text NOT NULL,
	`classification` text,
	`slug` text NOT NULL,
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`company_id`) REFERENCES `management_companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pension_funds_slug_unique` ON `pension_funds` (`slug`);--> statement-breakpoint
CREATE TABLE `quality_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fund_id` text NOT NULL,
	`report_period` integer NOT NULL,
	`overall_score` real NOT NULL,
	`return_score` real,
	`fee_score` real,
	`size_score` real,
	`actuarial_score` real,
	`service_score` real,
	`flexibility_score` real,
	`claims_score` real,
	`penalty_total` real,
	`rank` integer,
	`calculated_at` text NOT NULL,
	FOREIGN KEY (`fund_id`) REFERENCES `pension_funds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quality_scores_fund_id_report_period_unique` ON `quality_scores` (`fund_id`,`report_period`);