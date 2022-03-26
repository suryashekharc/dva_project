"""
1. Load contents of page with all location subreddits
2. Infer the sub names from the links
3. Filter by USA locations
4. Run scrape_reddit_comments on them

Note: Discarded pushshift because https://github.com/pushshift/api
Limit of size of returned object <= 500
"""
import argparse
from urllib.request import urlopen
from bs4 import BeautifulSoup
from scrape_reddit_comments import ScrapeRedditComments

class AutomateScraping:
    def __init__(self) -> None:
        pass

    def get_links(self, page_url: str) -> list[str]:
        """Returns the list of links available on the page_url
        """
        text = urlopen(page_url).read()
        soup = BeautifulSoup(text)
        link_dict = {}
        data = soup.findAll('div',attrs={'class':'md wiki'})
        for div in data:
            links = div.findAll('a')
            for a in links:
                print(a['href'])
                if a['href'].startswith("/r/") and \
                    len(a['href'].split('/')) == 3:
                    title, link = a.contents[0], a['href']
                    link_dict[title] = link
        return link_dict

    def scrape_reddit(self, link_dict: dict) -> None:
        scr = ScrapeRedditComments()
        for title, link in link_dict.items():
            sub_name = link.split('/r/')[1]
            location = ''.join(filter(str.isalpha, title))
            print(f"Scraping for: {location}")
            args = argparse.Namespace(
                subreddit_name=sub_name,
                post_count=5000,
                time_filter="month",
                fields="body,author_fullname,author.name,controversiality,created,downs,fullname,id,is_root,link_author,link_id,link_permalink,link_title,permalink,score,subreddit_name_prefixed,total_awards_received,ups",
                location=location,
                min_threshold=800
            )
            scr = ScrapeRedditComments()
            scr.scrape(args=args)

if __name__ == "__main__":
    as_obj = AutomateScraping()
    link_dict = as_obj.get_links(page_url='https://www.reddit.com/r/LocationReddits/wiki/faq/northamerica')
    as_obj.scrape_reddit(link_dict)