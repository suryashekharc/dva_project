import argparse
import sys

import pandas as pd
from operator import attrgetter
import praw
import credentials
class ScrapeRedditComments:
    def __init__(self):
        # NOTE: Ensure the credentials.py file is present in the current directory
        # and not committed to the repo
        self.reddit_obj = praw.Reddit(client_id=credentials.client_id,
                                client_secret=credentials.client_secret,
                                user_agent=credentials.user_agent,
                                username=credentials.username)
        if not self.reddit_obj.read_only:  # Flag to ensure this object has been correctly configured
            raise Exception("Reddit object not configured correctly to be read_only.")


    def scrape(self, args):
        fields = args.fields.split(',')
        df_dict_list = []
        exception_ct = 0
        row_ct = 0
        # for cases where sub name isn't exactly the location name
        location = args.location if "location" in args \
            else args.subreddit_name
        try:
            for comment in self.reddit_obj.subreddit(
                args.subreddit_name).comments(limit=args.post_count
                ):
                row_ct += 1
                row = {}
                try:
                    for field in fields:
                        row[field] = attrgetter(field)(comment)
                    df_dict_list.append(row)
                except Exception as e:
                    print(f"Exception {exception_ct} while processing {row_ct}")
                    print(e)
                    exception_ct += 1
        except Exception as e:
            print(f"Problem with sub: {e}")

        df = pd.DataFrame.from_records(df_dict_list)
        if "min_threshold" in args:
            if len(df) >= args.min_threshold:
                df.to_csv(f"data/{location}_{len(df)}.csv", header=True, index=False)
            else:
                print("Skipping, insufficient data")
        else:
            df.to_csv(f"data/{location}_{len(df)}.csv", header=True, index=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--subreddit_name', dest='subreddit_name', default="SeattleWA",
                        help="""Name of the subreddit""")
    parser.add_argument('--post_count', dest='post_count', default=50000,
                        help="""Number of posts to fetch""")
    parser.add_argument('--time_filter', dest='time_filter', default="month",
                        help="""day/month/week etc since we are sorting by top""")
    parser.add_argument('--fields', dest='fields',
                        default="body,author_fullname,author.name,controversiality,created,downs,fullname,id,is_root,link_author,link_id,link_permalink,link_title,permalink,score,subreddit_name_prefixed,total_awards_received,ups",
                        help="""Comma-separated list of fields to save""")

    scr = ScrapeRedditComments()
    scr.scrape(args=parser.parse_args())
    sys.exit(0)

